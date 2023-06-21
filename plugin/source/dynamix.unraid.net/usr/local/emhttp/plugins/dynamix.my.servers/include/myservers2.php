<?php
/**
 * Build vars for user profile prop
 */

// add 'ipaddr' function for 6.9 backwards compatibility
if (!function_exists('ipaddr')) {
    function ipaddr($ethX = 'eth0', $prot = 4)
    {
        $ethXData = $$ethX;

        if (isset($ethXData['PROTOCOL:0'])) {
            $protocol = $ethXData['PROTOCOL:0'];
            $ipaddr = $ethXData['IPADDR:0'];
            $ipaddr6 = $ethXData['IPADDR6:0'];

            switch ($protocol) {
                case 'ipv4':
                    return $ipaddr;
                case 'ipv6':
                    return $ipaddr6;
                case 'ipv4+ipv6':
                    return ($prot === 4) ? $ipaddr : $ipaddr6;
            }
        }

        return '';
    }
}

$configErrorEnum = [
    "error" => 'UNKNOWN_ERROR',
    "invalid" => 'INVALID',
    "nokeyserver" => 'NO_KEY_SERVER',
    "withdrawn" => 'WITHDRAWN',
];

// read flashbackup ini file
$flashbackup_ini = '/var/local/emhttp/flashbackup.ini';
$flashbackup_status = (file_exists($flashbackup_ini)) ? @parse_ini_file($flashbackup_ini) : [];

$nginx = parse_ini_file('/var/local/emhttp/nginx.ini');

// base OS only, plugin not installed • show ad for plugin
$pluginInstalled = '';
if (file_exists('/var/lib/pkgtools/packages/dynamix.unraid.net')) $pluginInstalled = 'dynamix.unraid.net.plg';
if (file_exists('/var/lib/pkgtools/packages/dynamix.unraid.net.staging')) $pluginInstalled = 'dynamix.unraid.net.staging.plg';
// plugin install failed if the unraid-api file doesn't fully install • append failure detected so we can show warning about failed install via UPC
if ($pluginInstalled && !file_exists('/usr/local/sbin/unraid-api')) $pluginInstalled .= '_installFailed';

$plgversion = file_exists('/var/log/plugins/dynamix.unraid.net.plg')
    ? trim(@exec('/usr/local/sbin/plugin version /var/log/plugins/dynamix.unraid.net.plg 2>/dev/null'))
    : (file_exists('/var/log/plugins/dynamix.unraid.net.staging.plg')
        ? trim(@exec('/usr/local/sbin/plugin version /var/log/plugins/dynamix.unraid.net.staging.plg 2>/dev/null'))
        : 'base-' . $var['version']);

$myservers_flash_cfg_path='/boot/config/plugins/dynamix.my.servers/myservers.cfg';
$myservers = file_exists($myservers_flash_cfg_path) ? @parse_ini_file($myservers_flash_cfg_path,true) : [];

$serverData = [
    "apiKey" => $myservers['upc']['apikey'] ?? '',
    "apiVersion" => $myservers['api']['version'] ?? '',
    "avatar" => (!empty($myservers['remote']['avatar']) && $pluginInstalled) ? $myservers['remote']['avatar'] : '',
    "config" => [
        'valid' => ($var['configValid'] === 'yes'),
        'error' => isset($configErrorEnum[$var['configValid']]) ? $configErrorEnum[$var['configValid']] : 'UNKNOWN_ERROR',
    ],
    "csrf" => $var['csrf_token'],
    "description" => $var['COMMENT'] ?? '',
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
    "locale" => ($_SESSION['locale']) ? $_SESSION['locale'] : 'en_US',
    "model" => $var['SYS_MODEL'],
    "name" => $var['NAME'],
    "osVersion" => $var['version'],
    "pluginInstalled" => $pluginInstalled,
    "pluginVersion" => $pluginVersion,
    "protocol" => $_SERVER['REQUEST_SCHEME'],
    "regGen" => (int)$var['regGen'],
    "regGuid" => $var['regGUID'],
    "registered" => (!empty($myservers['remote']['username']) && $pluginInstalled),
    "registeredTime" => $myservers['remote']['regWizTime'] ?? '',
    "site" => $_SERVER['REQUEST_SCHEME'] . "://" . $_SERVER['HTTP_HOST'],
    "state" => strtoupper(empty($var['regCheck']) ? $var['regTy'] : $var['regCheck']),
    "theme" => [
        "banner" => !empty($display['banner']),
        "bannerGradient" => $display['showBannerGradient'] === 'yes' ?? false,
        "bgColor" => ($backgnd) ? '#' . $backgnd : '',
        "descriptionShow" => (!empty($display['headerdescription']) && $display['headerdescription'] !== 'no'),
        "metaColor" => ($display['headermetacolor'] ?? '') ? '#' . $display['headermetacolor'] : '',
        "name" => $display['theme'],
        "textColor" => ($header) ? '#' . $header : '',
    ],
    "ts" => time(),
    "uptime" => 1000 * (time() - round(strtok(exec("cat /proc/uptime"), ' '))),
    "username" => (!empty($myservers['remote']['username']) && $pluginInstalled) ? $myservers['remote']['username'] : '',
    "wanFQDN" => $nginx['NGINX_WANFQDN'] ?? '',
];

echo "<connect-user-profile server='" . json_encode($serverData) . "'></connect-user-profile>";
?>
<script>
/**
 * So we're not needing to modify DefaultLayout with an additional include,
 * we'll add the Modals web component to the bottom of the body
 */
const modalsWebComponent = 'connect-modals';
if (!document.getElementsByTagName(modalsWebComponent).length) {
    const $body = document.getElementsByTagName('body')[0];
    const $modals = document.createElement(modalsWebComponent);
    $body.appendChild($modals);
}
</script>
