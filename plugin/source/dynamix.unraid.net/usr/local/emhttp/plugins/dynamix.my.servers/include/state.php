<?php
// read flashbackup ini file
$flashbackup_ini = '/var/local/emhttp/flashbackup.ini';
$flashbackup_status = (file_exists($flashbackup_ini)) ? @parse_ini_file($flashbackup_ini) : [];

$nginx = parse_ini_file('/var/local/emhttp/nginx.ini');

// base OS only, plugin not installed • show ad for plugin
$connectPluginInstalled = '';
if (file_exists('/var/lib/pkgtools/packages/dynamix.unraid.net')) $connectPluginInstalled = 'dynamix.unraid.net.plg';
if (file_exists('/var/lib/pkgtools/packages/dynamix.unraid.net.staging')) $connectPluginInstalled = 'dynamix.unraid.net.staging.plg';
// plugin install failed if the unraid-api file doesn't fully install • append failure detected so we can show warning about failed install via UPC
if ($connectPluginInstalled && !file_exists('/usr/local/sbin/unraid-api')) $connectPluginInstalled .= '_installFailed';

$connectPluginVersion = file_exists('/var/log/plugins/dynamix.unraid.net.plg')
    ? trim(@exec('/usr/local/sbin/plugin version /var/log/plugins/dynamix.unraid.net.plg 2>/dev/null'))
    : (file_exists('/var/log/plugins/dynamix.unraid.net.staging.plg')
        ? trim(@exec('/usr/local/sbin/plugin version /var/log/plugins/dynamix.unraid.net.staging.plg 2>/dev/null'))
        : 'base-' . $var['version']);

$myservers_flash_cfg_path = '/boot/config/plugins/dynamix.my.servers/myservers.cfg';
$myservers = file_exists($myservers_flash_cfg_path) ? @parse_ini_file($myservers_flash_cfg_path,true) : [];

$configErrorEnum = [
    "error" => 'UNKNOWN_ERROR',
    "invalid" => 'INVALID',
    "nokeyserver" => 'NO_KEY_SERVER',
    "withdrawn" => 'WITHDRAWN',
];

$osVersionBranch = trim(@exec('plugin category /var/log/plugins/unRAIDServer.plg') ?? 'stable');
$registered = !empty($myservers['remote']['apikey']) && $connectPluginInstalled;

/**
 * Reboot detection
 */
$rebootReadme = @file_get_contents("$docroot/plugins/unRAIDServer/README.md",false,null,0,20)?:''; // read first 20 bytes of README.md
$rebootDetected = preg_match("/^\*\*(REBOOT REQUIRED|DOWNGRADE)/", $rebootReadme);

$rebootForDowngrade = $rebootDetected && strpos($rebootReadme, 'DOWNGRADE') !== false;
$rebootForUpdate = $rebootDetected && strpos($rebootReadme, 'REBOOT REQUIRED') !== false;

$rebootType = $rebootForDowngrade ? 'downgrade' : ($rebootForUpdate ? 'update' : '');
$rebootVersion = '';
/**
 * Detect if third-party drivers were part of the update process
 */
$processWaitingThirdParthDrivers = "inotifywait -q /boot/changes.txt -e move_self,delete_self";
// Run the ps command to list processes and check if the process is running
$ps_command = "ps aux | grep -E \"$processWaitingThirdParthDrivers\" | grep -v \"grep -E\"";
$output = shell_exec($ps_command) ?? '';
if (strpos($output, $processWaitingThirdParthDrivers) !== false) {
    $rebootType = 'thirdPartyDriversDownloading';
}

function rebootExtractVersion() {
    $file_path = '/boot/changes.txt';

    // Check if the file exists
    if (file_exists($file_path)) {
        // Open the file for reading
        $file = fopen($file_path, 'r');

        // Read the file line by line until we find a line that starts with '# Version'
        while (($line = fgets($file)) !== false) {
            if (strpos($line, '# Version') === 0) {
                // Use a regular expression to extract the full version string
                if (preg_match('/# Version\s+(\S+)/', $line, $matches)) {
                    $fullVersion = $matches[1];
                    return $fullVersion;
                } else {
                    return 'Not found';
                }
                break;
            }
        }

        // Close the file
        fclose($file);
    } else {
        return 'File not found';
    }
}

if ($rebootType === 'downgrade' || $rebootType === 'update') {
    $rebootVersion = rebootExtractVersion();
}

$serverState = [
    "apiKey" => $myservers['upc']['apikey'] ?? '',
    "apiVersion" => $myservers['api']['version'] ?? '',
    "avatar" => (!empty($myservers['remote']['avatar']) && $connectPluginInstalled) ? $myservers['remote']['avatar'] : '',
    "config" => [
        'valid' => ($var['configValid'] === 'yes'),
        /** @todo remove error key value when config is valid */
        'error' => isset($configErrorEnum[$var['configValid']]) ? $configErrorEnum[$var['configValid']] : 'UNKNOWN_ERROR',
    ],
    "connectPluginInstalled" => $connectPluginInstalled,
    "connectPluginVersion" => $connectPluginVersion,
    "csrf" => $var['csrf_token'],
    "dateTimeFormat" => [
        "date" => @$display['date'] ?? '',
        "time" => @$display['time'] ?? '',
    ],
    "description" => $var['COMMENT'] ? htmlspecialchars($var['COMMENT']) : '',
    "deviceCount" => $var['deviceCount'],
    "email" => $myservers['remote']['email'] ?? '',
    "expireTime" => 1000 * (($var['regTy'] === 'Trial' || strstr($var['regTy'], 'expired')) ? $var['regTm2'] : 0),
    "extraOrigins" => explode(',', $myservers['api']['extraOrigins'] ?? ''),
    "flashProduct" => $var['flashProduct'],
    "flashVendor" => $var['flashVendor'],
    "flashBackupActivated" => empty($flashbackup_status['activated']) ? '' : 'true',
    "guid" => $var['flashGUID'],
    "hasRemoteApikey" => !empty($myservers['remote']['apikey']),
    "internalPort" => $_SERVER['SERVER_PORT'],
    "keyfile" => empty($var['regFILE']) ? '' : str_replace(['+', '/', '='], ['-', '_', ''], trim(base64_encode(@file_get_contents($var['regFILE'])))),
    "lanIp" => ipaddr(),
    "locale" => (!empty($_SESSION) && $_SESSION['locale']) ? $_SESSION['locale'] : 'en_US',
    "model" => $var['SYS_MODEL'],
    "name" => htmlspecialchars($var['NAME']),
    "osVersion" => $var['version'],
    "osVersionBranch" => $osVersionBranch,
    "protocol" => $_SERVER['REQUEST_SCHEME'],
    "rebootType" => $rebootType,
    "rebootVersion" => $rebootVersion,
    "regDev" => @(int)$var['regDev'] ?? 0,
    "regGen" => @(int)$var['regGen'],
    "regGuid" => @$var['regGUID'] ?? '',
    "regTo" => @htmlspecialchars($var['regTo']) ?? '',
    "regTm" => $var['regTm'] ? @$var['regTm'] * 1000 : '', // JS expects milliseconds
    "regTy" => @$var['regTy'] ?? '',
    "regExp" => $var['regExp'] ? @$var['regExp'] * 1000 : '', // JS expects milliseconds
    "registered" => $registered,
    "registeredTime" => $myservers['remote']['regWizTime'] ?? '',
    "site" => $_SERVER['REQUEST_SCHEME'] . "://" . $_SERVER['HTTP_HOST'],
    "state" => strtoupper(empty($var['regCheck']) ? $var['regTy'] : $var['regCheck']),
    "theme" => [
        "banner" => !empty($display['banner']),
        "bannerGradient" => $display['showBannerGradient'] === 'yes' ?? false,
        "bgColor" => ($display['background']) ? '#' . $display['background'] : '',
        "descriptionShow" => (!empty($display['headerdescription']) && $display['headerdescription'] !== 'no'),
        "metaColor" => ($display['headermetacolor'] ?? '') ? '#' . $display['headermetacolor'] : '',
        "name" => $display['theme'],
        "textColor" => ($display['header']) ? '#' . $display['header'] : '',
    ],
    "ts" => time(),
    "uptime" => 1000 * (time() - round(strtok(exec("cat /proc/uptime"), ' '))),
    "username" => $myservers['remote']['username'] ?? '',
    "wanFQDN" => $nginx['NGINX_WANFQDN'] ?? '',
];
