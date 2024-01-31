<?php
/* Copyright 2005-2023, Lime Technology
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */
/**
 * @todo refactor globals – currently if you try to use $GLOBALS the class will break.
 */
$webguiGlobals = $GLOBALS;
$docroot = $docroot ?? $_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp';

require_once "$docroot/plugins/dynamix.my.servers/include/reboot-details.php";
require_once "$docroot/plugins/dynamix.plugin.manager/include/UnraidCheck.php";
/**
 * ServerState class encapsulates server-related information and settings.
 *
 * Usage:
 * ```
 * require_once "$docroot/plugins/dynamix.my.servers/include/state.php";
 * $serverStateClass = new ServerState();
 *
 * $serverStateClass->getServerState();
 * or
 * $serverStateClass->getServerStateJson();
 * ```
 */
class ServerState
{
    protected $webguiGlobals;

    private $var;
    private $flashbackupCfg;
    private $connectPluginInstalled = '';
    private $connectPluginVersion;
    private $configErrorEnum = [
        "error" => 'UNKNOWN_ERROR',
        "invalid" => 'INVALID',
        "nokeyserver" => 'NO_KEY_SERVER',
        "withdrawn" => 'WITHDRAWN',
    ];
    private $osVersion;
    private $osVersionBranch;
    private $rebootDetails;
    private $caseModel = '';
    private $keyfileBase64UrlSafe = '';
    private $updateOsCheck;
    private $updateOsResponse;
    private $updateOsIgnoredReleases = [];

    public $myServersFlashCfg = [];
    public $myServersMemoryCfg = [];
    public $host = 'unknown';
    public $combinedKnownOrigins = [];
 
    public $nginxCfg;
    public $flashbackupStatus;
    public $registered;
    public $myServersMiniGraphConnected = false;
    public $keyfileBase64 = '';

    /**
     * Constructor to initialize class properties and gather server information.
     */
    public function __construct()
    {
        /**
         * @note – necessary evil until full webgui is class based.
         * @see - getWebguiGlobal() for usage
         * */
        global $webguiGlobals;
        $this->webguiGlobals =& $webguiGlobals;
        // echo "<pre>" . json_encode($this->webguiGlobals, JSON_PRETTY_PRINT) . "</pre>";

        $this->var = (array)parse_ini_file('state/var.ini');
        $this->nginxCfg = parse_ini_file('/var/local/emhttp/nginx.ini');

        $this->flashbackupCfg = '/var/local/emhttp/flashbackup.ini';
        $this->flashbackupStatus = (file_exists($this->flashbackupCfg)) ? @parse_ini_file($this->flashbackupCfg) : [];

        if (file_exists('/var/lib/pkgtools/packages/dynamix.unraid.net')) {
            $this->connectPluginInstalled = 'dynamix.unraid.net.plg';
        }
        if (file_exists('/var/lib/pkgtools/packages/dynamix.unraid.net.staging')) {
            $this->connectPluginInstalled = 'dynamix.unraid.net.staging.plg';
        }
        if ($this->connectPluginInstalled && !file_exists('/usr/local/sbin/unraid-api')) {
            $this->connectPluginInstalled .= '_installFailed';
        }

        $this->connectPluginVersion = file_exists('/var/log/plugins/dynamix.unraid.net.plg')
            ? trim(@exec('/usr/local/sbin/plugin version /var/log/plugins/dynamix.unraid.net.plg 2>/dev/null'))
            : (file_exists('/var/log/plugins/dynamix.unraid.net.staging.plg')
                ? trim(@exec('/usr/local/sbin/plugin version /var/log/plugins/dynamix.unraid.net.staging.plg 2>/dev/null'))
                : 'base-' . $this->var['version']);
        /**
         * @todo can we read this from somewhere other than the flash? Connect page uses this path and /boot/config/plugins/dynamix.my.servers/myservers.cfg…
         * - $myservers_memory_cfg_path ='/var/local/emhttp/myservers.cfg';
         * - $mystatus = (file_exists($myservers_memory_cfg_path)) ? @parse_ini_file($myservers_memory_cfg_path) : [];
         */
        $flashCfgPath = '/boot/config/plugins/dynamix.my.servers/myservers.cfg';
        $this->myServersFlashCfg = file_exists($flashCfgPath) ? @parse_ini_file($flashCfgPath, true) : [];
        // ensure some vars are defined here so we don't have to test them later
        if (empty($this->myServersFlashCfg['remote']['apikey'])) {
            $this->myServersFlashCfg['remote']['apikey'] = "";
        }
        if (empty($this->myServersFlashCfg['remote']['wanaccess'])) {
            $this->myServersFlashCfg['remote']['wanaccess'] = "no";
        }
        if (empty($this->myServersFlashCfg['remote']['wanport'])) {
            $this->myServersFlashCfg['remote']['wanport'] = 33443;
        }
        if (empty($this->myServersFlashCfg['remote']['upnpEnabled'])) {
            $this->myServersFlashCfg['remote']['upnpEnabled'] = "no";
        }
        if (empty($this->myServersFlashCfg['remote']['dynamicRemoteAccessType'])) {
            $this->myServersFlashCfg['remote']['dynamicRemoteAccessType'] = "DISABLED";
        }

        $this->osVersion = $this->var['version'];
        $this->osVersionBranch = trim(@exec('plugin category /var/log/plugins/unRAIDServer.plg') ?? 'stable');
        $this->registered = !empty($this->myServersFlashCfg['remote']['apikey']) && $this->connectPluginInstalled;

        $caseModelFile = '/boot/config/plugins/dynamix/case-model.cfg';
        $this->caseModel = file_exists($caseModelFile) ? file_get_contents($caseModelFile) : '';

        $this->rebootDetails = new RebootDetails();

        /**
         * Allowed origins warning displayed when the current webGUI URL is NOT included in the known lists of allowed origins.
         * Include localhost in the test, but only display HTTP(S) URLs that do not include localhost.
         */
        $this->host = $_SERVER['HTTP_HOST'] ?? "unknown";
        $memoryCfgPath = '/var/local/emhttp/myservers.cfg';
        $this->myServersMemoryCfg = (file_exists($memoryCfgPath)) ? @parse_ini_file($memoryCfgPath) : [];
        $this->myServersMiniGraphConnected = (($this->myServersMemoryCfg['minigraph']??'') === 'CONNECTED');

        $allowedOrigins = $this->myServersMemoryCfg['allowedOrigins'] ?? "";
        $extraOrigins = $this->myServersFlashCfg['api']['extraOrigins'] ?? "";
        $combinedOrigins = $allowedOrigins . "," . $extraOrigins; // combine the two strings for easier searching
        $combinedOrigins = str_replace(" ", "", $combinedOrigins); // replace any spaces with nothing
        $hostNotKnown = stripos($combinedOrigins, $this->host) === false; // check if the current host is in the combined list of origins
        if ($hostNotKnown) {
            $this->combinedKnownOrigins = explode(",", $combinedOrigins);

            if ($this->combinedKnownOrigins) {
                foreach($this->combinedKnownOrigins as $key => $origin) {
                    if ( (strpos($origin, "http") === false) || (strpos($origin, "localhost") !== false) ) {
                        // clean up $this->combinedKnownOrigins, only display warning if origins still remain to display
                        unset($this->combinedKnownOrigins[$key]);
                    }
                }
                // for some reason the unset creates an associative array, so reindex the array with just the values. Otherwise we get an object passed to the UPC JS instead of an array.
                if ($this->combinedKnownOrigins) {
                    $this->combinedKnownOrigins = array_values($this->combinedKnownOrigins);
                }
            }
        }

        $this->keyfileBase64 = empty($this->var['regFILE']) ? null : @file_get_contents($this->var['regFILE']);
        if ($this->keyfileBase64 !== false) {
          $this->keyfileBase64 = @base64_encode($this->keyfileBase64);
          $this->keyfileBase64UrlSafe = str_replace(['+', '/', '='], ['-', '_', ''], trim($this->keyfileBase64));
        }

        $this->updateOsCheck = new UnraidOsCheck();
        $this->updateOsResponse = $this->updateOsCheck->getUnraidOSCheckResult();
        $this->updateOsIgnoredReleases = $this->updateOsCheck->getIgnoredReleases();
    }

    /**
     * Retrieve the value of a webgui global setting.
     */
    public function getWebguiGlobal(string $key) {
        return $this->webguiGlobals[$key];
    }
    /**
     * Retrieve the server information as an associative array
     *
     * @return array An array containing server information.
     */
    public function getServerState()
    {
        $serverState = [
            "apiKey" => $this->myServersFlashCfg['upc']['apikey'] ?? '',
            "apiVersion" => $this->myServersFlashCfg['api']['version'] ?? '',
            "avatar" => (!empty($this->myServersFlashCfg['remote']['avatar']) && $this->connectPluginInstalled) ? $this->myServersFlashCfg['remote']['avatar'] : '',
            "caseModel" => $this->caseModel,
            "config" => [
                'valid' => ($this->var['configValid'] === 'yes'),
                'error' => isset($this->configErrorEnum[$this->var['configValid']]) ? $this->configErrorEnum[$this->var['configValid']] : 'UNKNOWN_ERROR',
            ],
            "connectPluginInstalled" => $this->connectPluginInstalled,
            "connectPluginVersion" => $this->connectPluginVersion,
            "csrf" => $this->var['csrf_token'],
            "dateTimeFormat" => [
                "date" => @$this->getWebguiGlobal('display')['date'] ?? '',
                "time" => @$this->getWebguiGlobal('display')['time'] ?? '',
            ],
            "description" => $this->var['COMMENT'] ? htmlspecialchars($this->var['COMMENT']) : '',
            "deviceCount" => $this->var['deviceCount'],
            "email" => $this->myServersFlashCfg['remote']['email'] ?? '',
            "expireTime" => 1000 * (($this->var['regTy'] === 'Trial' || strstr($this->var['regTy'], 'expired')) ? $this->var['regTm2'] : 0),
            "extraOrigins" => explode(',', $this->myServersFlashCfg['api']['extraOrigins'] ?? ''),
            "flashProduct" => $this->var['flashProduct'],
            "flashVendor" => $this->var['flashVendor'],
            "flashBackupActivated" => empty($this->flashbackupStatus['activated']) ? '' : 'true',
            "guid" => $this->var['flashGUID'],
            "hasRemoteApikey" => !empty($this->myServersFlashCfg['remote']['apikey']),
            "internalPort" => $_SERVER['SERVER_PORT'],
            "keyfile" => $this->keyfileBase64UrlSafe,
            "lanIp" => ipaddr(),
            "locale" => (!empty($_SESSION) && $_SESSION['locale']) ? $_SESSION['locale'] : 'en_US',
            "model" => $this->var['SYS_MODEL'],
            "name" => htmlspecialchars($this->var['NAME']),
            "osVersion" => $this->osVersion,
            "osVersionBranch" => $this->osVersionBranch,
            "protocol" => $_SERVER['REQUEST_SCHEME'],
            "rebootType" => $this->rebootDetails->getRebootType(),
            "regDev" => @(int)$this->var['regDev'] ?? 0,
            "regGen" => @(int)$this->var['regGen'],
            "regGuid" => @$this->var['regGUID'] ?? '',
            "regTo" => @htmlspecialchars($this->var['regTo']) ?? '',
            "regTm" => $this->var['regTm'] ? @$this->var['regTm'] * 1000 : '', // JS expects milliseconds
            "regTy" => @$this->var['regTy'] ?? '',
            "regExp" => $this->var['regExp'] ? @$this->var['regExp'] * 1000 : '', // JS expects milliseconds
            "registered" => $this->registered,
            "registeredTime" => $this->myServersFlashCfg['remote']['regWizTime'] ?? '',
            "site" => $_SERVER['REQUEST_SCHEME'] . "://" . $_SERVER['HTTP_HOST'],
            "state" => strtoupper(empty($this->var['regCheck']) ? $this->var['regTy'] : $this->var['regCheck']),
            "theme" => [
                "banner" => !empty($this->getWebguiGlobal('display')['banner']),
                "bannerGradient" => $this->getWebguiGlobal('display')['showBannerGradient'] === 'yes' ?? false,
                "bgColor" => ($this->getWebguiGlobal('display')['background']) ? '#' . $this->getWebguiGlobal('display')['background'] : '',
                "descriptionShow" => (!empty($this->getWebguiGlobal('display')['headerdescription']) && $this->getWebguiGlobal('display')['headerdescription'] !== 'no'),
                "metaColor" => ($this->getWebguiGlobal('display')['headermetacolor'] ?? '') ? '#' . $this->getWebguiGlobal('display')['headermetacolor'] : '',
                "name" => $this->getWebguiGlobal('display')['theme'],
                "textColor" => ($this->getWebguiGlobal('display')['header']) ? '#' . $this->getWebguiGlobal('display')['header'] : '',
            ],
            "ts" => time(),
            "uptime" => 1000 * (time() - round(strtok(exec("cat /proc/uptime"), ' '))),
            "username" => $this->myServersFlashCfg['remote']['username'] ?? '',
            "wanFQDN" => $this->nginxCfg['NGINX_WANFQDN'] ?? '',
        ];

        if ($this->combinedKnownOrigins) {
            $serverState['combinedKnownOrigins'] = $this->combinedKnownOrigins;
        }

        if ($this->updateOsResponse) {
            $serverState['updateOsResponse'] = $this->updateOsResponse;
        }

        if ($this->updateOsIgnoredReleases) {
            $serverState['updateOsIgnoredReleases'] = $this->updateOsIgnoredReleases;
        }

        return $serverState;
    }

    /**
     * Retrieve the server information as a JSON string
     *
     * @return string A JSON string containing server information.
     */
    public function getServerStateJson() {
        return json_encode($this->getServerState());
    }
}
