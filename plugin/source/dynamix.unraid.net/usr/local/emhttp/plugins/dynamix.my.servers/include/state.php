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
require_once "$docroot/plugins/dynamix.my.servers/include/api-config.php";
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
    private $apiKey = '';
    private $apiVersion = '';
    private $avatar = '';
    private $email = '';
    private $extraOrigins = [];
    private $flashBackupActivated = '';
    private $hasRemoteApikey = false;
    private $registeredTime = '';
    private $username = '';
    private $connectPluginInstalled = '';
    private $connectPluginVersion;
    private $configErrorEnum = [
        "error" => 'UNKNOWN_ERROR',
        "ineligible" => 'INELIGIBLE',
        "invalid" => 'INVALID',
        "nokeyserver" => 'NO_KEY_SERVER',
        "withdrawn" => 'WITHDRAWN',
    ];
    /**
     * SSO Sub IDs from the my servers config file.
     */
    public $ssoEnabled = false;
    private $osVersion;
    private $osVersionBranch;
    private $rebootDetails;
    private $caseModel = '';
    private $keyfileBase64UrlSafe = '';
    private $updateOsCheck;
    private $updateOsNotificationsEnabled = false;
    private $updateOsResponse;
    private $updateOsIgnoredReleases = [];

    public $myServersFlashCfg = [];
    public $myServersMemoryCfg = [];
    public $host = 'unknown';
    public $combinedKnownOrigins = [];

    public $nginxCfg = [];
    public $flashbackupStatus = [];
    public $registered = false;
    public $myServersMiniGraphConnected = false;
    public $keyfileBase64 = '';
    public $state = 'UNKNOWN';

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
        $this->webguiGlobals = &$webguiGlobals;
        // echo "<pre>" . json_encode($this->webguiGlobals, JSON_PRETTY_PRINT) . "</pre>";

        $this->var = $webguiGlobals['var'];

        $patcherVersion = null;
        if (file_exists('/tmp/Patcher/patches.json')) {
            $patcherData = @json_decode(file_get_contents('/tmp/Patcher/patches.json'), true);
            $unraidVersionInfo = parse_ini_file('/etc/unraid-version');
            if ($patcherData['unraidVersion'] === $unraidVersionInfo['version']) {
                $patcherVersion = $patcherData['combinedVersion'] ?? null;
            }
        }
        // If we're on a patch, we need to use the combinedVersion to check for updates
        if ($patcherVersion) {
            $this->var['version'] = $patcherVersion;
        }

        $this->nginxCfg = @parse_ini_file('/var/local/emhttp/nginx.ini') ?? [];

        $this->state = strtoupper(empty($this->var['regCheck']) ? $this->var['regTy'] : $this->var['regCheck']);
        $this->osVersion = $this->var['version'];
        $this->osVersionBranch = trim(@exec('plugin category /var/log/plugins/unRAIDServer.plg') ?? 'stable');

        $caseModelFile = '/boot/config/plugins/dynamix/case-model.cfg';
        $this->caseModel = file_exists($caseModelFile) ? htmlspecialchars(@file_get_contents($caseModelFile), ENT_HTML5, 'UTF-8') : '';

        $this->rebootDetails = new RebootDetails();

        $this->keyfileBase64 = empty($this->var['regFILE']) ? null : @file_get_contents($this->var['regFILE']);
        if ($this->keyfileBase64 !== false) {
            $this->keyfileBase64 = @base64_encode($this->keyfileBase64);
            $this->keyfileBase64UrlSafe = str_replace(['+', '/', '='], ['-', '_', ''], trim($this->keyfileBase64));
        }

        $this->updateOsCheck = new UnraidOsCheck();
        $this->updateOsIgnoredReleases = $this->updateOsCheck->getIgnoredReleases();
        $this->updateOsNotificationsEnabled = !empty(@$this->getWebguiGlobal('notify', 'unraidos'));
        $this->updateOsResponse = $this->updateOsCheck->getUnraidOSCheckResult();

        // Initialize SSO state regardless of connect plugin status
        $this->ssoEnabled = ApiUserConfig::isSSOEnabled();

        $this->setConnectValues();
    }

    /**
     * Retrieve the value of a webgui global setting.
     */
    public function getWebguiGlobal(string $key, ?string $subkey = null)
    {
        if (!$subkey) {
            return _var($this->webguiGlobals, $key, '');
        }
        $keyArray = _var($this->webguiGlobals, $key, []);
        return _var($keyArray, $subkey, '');
    }

    private function setConnectValues()
    {
        if (!ApiConfig::isConnectPluginEnabled()) {
            return; // plugin is not installed; exit early
        }
        
        $this->connectPluginInstalled = 'dynamix.unraid.net.plg';
        $this->connectPluginVersion = ApiConfig::getApiVersion();
        $this->getMyServersCfgValues();
        $this->getConnectKnownOrigins();
        $this->getFlashBackupStatus();
    }

    private function getFlashBackupStatus()
    {
        $flashbackupCfg = '/var/local/emhttp/flashbackup.ini';
        $this->flashbackupStatus = (file_exists($flashbackupCfg)) ? @parse_ini_file($flashbackupCfg) : [];
        $this->flashBackupActivated = empty($this->flashbackupStatus['activated']) ? '' : 'true';
    }

    private function getMyServersCfgValues()
    {
        /**
         * Memory config is now written by the new API to /usr/local/emhttp/state/myservers.cfg
         * This contains runtime state including connection status.
         */
        $flashCfgPath = '/boot/config/plugins/dynamix.my.servers/myservers.cfg';
        $this->myServersFlashCfg = file_exists($flashCfgPath) ? @parse_ini_file($flashCfgPath, true) : [];
        $connectJsonPath = '/boot/config/plugins/dynamix.my.servers/configs/connect.json';
        $connectConfig = file_exists($connectJsonPath) ? @json_decode(file_get_contents($connectJsonPath), true) : [];

        // ensure some vars are defined here so we don't have to test them later
        if (empty($connectConfig['apikey'])) {
            $connectConfig['apikey'] = "";
        }
        if (empty($connectConfig['wanaccess'])) {
            $connectConfig['wanaccess'] = false;
        }
        if (empty($connectConfig['wanport'])) {
            $connectConfig['wanport'] = 33443;
        }
        if (empty($connectConfig['upnpEnabled'])) {
            $connectConfig['upnpEnabled'] = false;
        }
        if (empty($connectConfig['dynamicRemoteAccessType'])) {
            $connectConfig['dynamicRemoteAccessType'] = "DISABLED";
        }

        $this->apiKey = $this->myServersFlashCfg['upc']['apikey'] ?? '';
        $this->apiVersion = $this->myServersFlashCfg['api']['version'] ?? '';
        $this->avatar = (!empty($connectConfig['avatar']) && $this->connectPluginInstalled) ? $connectConfig['avatar'] : '';
        $this->email = $connectConfig['email'] ?? '';
        $this->hasRemoteApikey = !empty($connectConfig['apikey']);
        $this->registered = !empty($connectConfig['apikey']) && $this->connectPluginInstalled;
        $this->registeredTime = $connectConfig['regWizTime'] ?? '';
        $this->username = $connectConfig['username'] ?? '';
    }

    private function getConnectKnownOrigins()
    {
        /**
         * Allowed origins warning displayed when the current webGUI URL is NOT included in the known lists of allowed origins.
         * Include localhost in the test, but only display HTTP(S) URLs that do not include localhost.
         */
        $this->host = $_SERVER['HTTP_HOST'] ?? "unknown";
        // Read connection status and allowed origins from the new API status file
        $statusFilePath = '/var/local/emhttp/connectStatus.json';
        $connectionStatus = '';
        $allowedOrigins = '';
        
        if (file_exists($statusFilePath)) {
            $statusData = @json_decode(file_get_contents($statusFilePath), true);
            $connectionStatus = $statusData['connectionStatus'] ?? '';
            $allowedOrigins = $statusData['allowedOrigins'] ?? '';
        }
        
        $this->myServersMiniGraphConnected = ($connectionStatus === 'CONNECTED');

        $extraOrigins = $this->myServersFlashCfg['api']['extraOrigins'] ?? "";
        $combinedOrigins = $allowedOrigins . "," . $extraOrigins; // combine the two strings for easier searching
        $combinedOrigins = str_replace(" ", "", $combinedOrigins); // replace any spaces with nothing
        $hostNotKnown = stripos($combinedOrigins, $this->host) === false; // check if the current host is in the combined list of origins

        if ($extraOrigins) {
            $this->extraOrigins = explode(",", $extraOrigins);
        }

        if ($hostNotKnown) {
            $this->combinedKnownOrigins = explode(",", $combinedOrigins);

            if ($this->combinedKnownOrigins) {
                foreach ($this->combinedKnownOrigins as $key => $origin) {
                    if ((strpos($origin, "http") === false) || (strpos($origin, "localhost") !== false)) {
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
    }

    /**
     * Retrieve the server information as an associative array
     *
     * @return array An array containing server information.
     */
    public function getServerState()
    {
        $serverState = [
            "array" => [
                "state" => @$this->getWebguiGlobal('var', 'fsState'),
                "progress" => @$this->getWebguiGlobal('var', 'fsProgress'),
            ],
            "apiKey" => $this->apiKey,
            "apiVersion" => $this->apiVersion,
            "avatar" => $this->avatar,
            "caseModel" => $this->caseModel,
            "config" => [
                'valid' => ($this->var['configValid'] === 'yes'),
                'error' => isset($this->configErrorEnum[$this->var['configValid']]) ? $this->configErrorEnum[$this->var['configValid']] : null,
            ],
            "connectPluginInstalled" => $this->connectPluginInstalled,
            "connectPluginVersion" => $this->connectPluginVersion,
            "csrf" => $this->var['csrf_token'],
            "dateTimeFormat" => [
                "date" => @$this->getWebguiGlobal('display', 'date') ?? '',
                "time" => @$this->getWebguiGlobal('display', 'time') ?? '',
            ],
            "description" => $this->var['COMMENT'] ? htmlspecialchars($this->var['COMMENT'], ENT_HTML5, 'UTF-8') : '',
            "deviceCount" => $this->var['deviceCount'],
            "email" => $this->email,
            "expireTime" => 1000 * (($this->var['regTy'] === 'Trial' || strstr($this->var['regTy'], 'expired')) ? $this->var['regTm2'] : 0),
            "extraOrigins" => $this->extraOrigins,
            "flashProduct" => $this->var['flashProduct'],
            "flashVendor" => $this->var['flashVendor'],
            "flashBackupActivated" => $this->flashBackupActivated,
            "guid" => $this->var['flashGUID'],
            "hasRemoteApikey" => $this->hasRemoteApikey,
            "internalPort" => _var($_SERVER, 'SERVER_PORT'),
            "keyfile" => $this->keyfileBase64UrlSafe,
            "lanIp" => ipaddr(),
            "locale" => (!empty($_SESSION) && $_SESSION['locale']) ? $_SESSION['locale'] : 'en_US',
            "model" => $this->var['SYS_MODEL'] ? htmlspecialchars($this->var['SYS_MODEL'], ENT_HTML5, 'UTF-8') : '',
            "name" => htmlspecialchars($this->var['NAME'], ENT_HTML5, 'UTF-8'),
            "osVersion" => $this->osVersion,
            "osVersionBranch" => $this->osVersionBranch,
            "protocol" => _var($_SERVER, 'REQUEST_SCHEME'),
            "rebootType" => $this->rebootDetails->rebootType,
            "rebootVersion" => $this->rebootDetails->rebootVersion,
            "regDevs" => @(int)$this->var['regDevs'] ?? 0,
            "regGen" => @(int)$this->var['regGen'],
            "regGuid" => @$this->var['regGUID'] ?? '',
            "regTo" => @htmlspecialchars($this->var['regTo'], ENT_HTML5, 'UTF-8') ?? '',
            "regTm" => $this->var['regTm'] ? @$this->var['regTm'] * 1000 : '', // JS expects milliseconds
            "regTy" => @$this->var['regTy'] ?? '',
            "regExp" => $this->var['regExp'] ? @$this->var['regExp'] * 1000 : '', // JS expects milliseconds
            "registered" => $this->registered,
            "registeredTime" => $this->registeredTime,
            "site" => _var($_SERVER, 'REQUEST_SCHEME') . "://" . _var($_SERVER, 'HTTP_HOST'),
            "ssoEnabled" => $this->ssoEnabled,
            "state" => $this->state,
            "theme" => [
                "banner" => !empty($this->getWebguiGlobal('display', 'banner')),
                "bannerGradient" => $this->getWebguiGlobal('display', 'showBannerGradient') === 'yes' ?? false,
                "bgColor" => ($this->getWebguiGlobal('display', 'background')) ? '#' . $this->getWebguiGlobal('display', 'background') : '',
                "descriptionShow" => (!empty($this->getWebguiGlobal('display', 'headerdescription')) && $this->getWebguiGlobal('display', 'headerdescription') !== 'no'),
                "metaColor" => ($this->getWebguiGlobal('display', 'headermetacolor') ?? '') ? '#' . $this->getWebguiGlobal('display', 'headermetacolor') : '',
                "name" => $this->getWebguiGlobal('display', 'theme'),
                "textColor" => ($this->getWebguiGlobal('display', 'header')) ? '#' . $this->getWebguiGlobal('display', 'header') : '',
            ],
            "ts" => time(),
            "uptime" => 1000 * (time() - round(strtok(exec("cat /proc/uptime"), ' '))),
            "username" => $this->username,
            "wanFQDN" => @$this->nginxCfg['NGINX_WANFQDN'] ?? '',
        ];

        if ($this->combinedKnownOrigins) {
            $serverState['combinedKnownOrigins'] = $this->combinedKnownOrigins;
        }

        if ($this->updateOsIgnoredReleases) {
            $serverState['updateOsIgnoredReleases'] = $this->updateOsIgnoredReleases;
        }

        if ($this->updateOsNotificationsEnabled) {
            $serverState['updateOsNotificationsEnabled'] = $this->updateOsNotificationsEnabled;
        }

        if ($this->updateOsResponse) {
            $serverState['updateOsResponse'] = $this->updateOsResponse;
        }

        return $serverState;
    }

    /**
     * Retrieve the server information as JSON
     *
     * @return string
     */
    public function getServerStateJson()
    {
        return json_encode($this->getServerState());
    }

    /**
     * Retrieve the server information as JSON string with converted special characters to HTML entities
     *
     * @return string
     */
    public function getServerStateJsonForHtmlAttr()
    {
        $json = json_encode($this->getServerState());
        return htmlspecialchars($json, ENT_QUOTES, 'UTF-8');
    }
}
