<!-- myservers2 -->
<?
/**
 * Build vars for user profile prop
 */
// add 'ipaddr' function for 6.9 backwards compatibility
if (!function_exists('ipaddr')) {
  function ipaddr($ethX='eth0', $prot=4) {
    global $$ethX;
    switch ($$ethX['PROTOCOL:0']) {
    case 'ipv4':
      return $$ethX['IPADDR:0'];
    case 'ipv6':
      return $$ethX['IPADDR6:0'];
    case 'ipv4+ipv6':
      switch ($prot) {
      case 4: return $$ethX['IPADDR:0'];
      case 6: return $$ethX['IPADDR6:0'];
      default:return [$$ethX['IPADDR:0'],$$ethX['IPADDR6:0']];}
    default:
      return $$ethX['IPADDR:0'];
    }
  }
}
$configErrorEnum = [ // used to map $var['configValid'] value to mimic unraid-api's `configError` ENUM
  "error" => 'UNKNOWN_ERROR',
  "invalid" => 'INVALID',
  "nokeyserver" => 'NO_KEY_SERVER',
  "withdrawn" => 'WITHDRAWN',
];
// read flashbackup ini file
$flashbackup_ini = '/var/local/emhttp/flashbackup.ini';
$flashbackup_status = (file_exists($flashbackup_ini)) ? @parse_ini_file($flashbackup_ini) : [];

$nginx = parse_ini_file('/var/local/emhttp/nginx.ini');

$pluginInstalled = '';
if (!file_exists('/var/lib/pkgtools/packages/dynamix.unraid.net') && !file_exists('/var/lib/pkgtools/packages/dynamix.unraid.net.staging')) {
  $pluginInstalled = ''; // base OS only, plugin not installed • show ad for plugin
} else {
  // plugin is installed but if the unraid-api file doesn't fully install it's a failed install
  if (file_exists('/var/lib/pkgtools/packages/dynamix.unraid.net')) $pluginInstalled = 'dynamix.unraid.net.plg';
  if (file_exists('/var/lib/pkgtools/packages/dynamix.unraid.net.staging')) $pluginInstalled = 'dynamix.unraid.net.staging.plg';
  // plugin install failed • append failure detected so we can show warning about failed install via UPC
  if (!file_exists('/usr/local/sbin/unraid-api')) $pluginInstalled = $pluginInstalled . '_installFailed';
}
$plgversion = file_exists('/var/log/plugins/dynamix.unraid.net.plg')
  ? trim(@exec('/usr/local/sbin/plugin version /var/log/plugins/dynamix.unraid.net.plg 2>/dev/null'))
  : ( file_exists('/var/log/plugins/dynamix.unraid.net.staging.plg')
      ? trim(@exec('/usr/local/sbin/plugin version /var/log/plugins/dynamix.unraid.net.staging.plg 2>/dev/null'))
      : 'base-'.$var['version'] );

$serverData = [
  "apiKey" => $myservers['upc']['apikey'] ?? '',
  "apiVersion" => $myservers['api']['version'] ?? '',
  "avatar" => (!empty($myservers['remote']['avatar']) && $pluginInstalled) ? $myservers['remote']['avatar'] : '',
  "config" => [
    'valid' => $var['configValid'] === 'yes',
    'error' => $var['configValid'] !== 'yes'
      ? (array_key_exists($var['configValid'], $configErrorEnum) ? $configErrorEnum[$var['configValid']] : 'UNKNOWN_ERROR')
      : null,
  ],
  "csrf" => $var['csrf_token'],
  "description" => $var['COMMENT'] ?? '',
  "deviceCount" => $var['deviceCount'],
  "email" => $myservers['remote']['email'] ?? '',
  "expireTime" => 1000 * ($var['regTy'] == 'Trial' || strstr($var['regTy'],'expired') ? $var['regTm2'] : 0),
  "extraOrigins" => explode(',', $myservers['api']['extraOrigins']??''),
  "flashProduct" => $var['flashProduct'],
  "flashVendor" => $var['flashVendor'],
  "flashBackupActivated" => empty($flashbackup_status['activated']) ? '' : 'true',
  "guid" => $var['flashGUID'],
  "hasRemoteApikey" => !empty($myservers['remote']['apikey']),
  "internalIp" => ipaddr(),
  "internalPort" => $_SERVER['SERVER_PORT'],
  "keyfile" => empty($var['regFILE']) ? '' : str_replace(['+','/','='], ['-','_',''], trim(base64_encode(@file_get_contents($var['regFILE'])))),
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
  "site" => $_SERVER['REQUEST_SCHEME']."://".$_SERVER['HTTP_HOST'],
  "state" => strtoupper(empty($var['regCheck']) ? $var['regTy'] : $var['regCheck']),
  "theme" => [
    "banner" => $display['banner'] ?? '',
    "bannerGradient" => $display['showBannerGradient'] ?? 'yes',
    "bgColor" => ($backgnd) ? '#'.$backgnd : '',
    "descriptionShow" => ($display['headerdescription'] ?? '' != 'no') ? 'true' : '',
    "metaColor" => ($display['headermetacolor'] ?? '') ? '#'.$display['headermetacolor'] : '',
    "name" => $display['theme'],
    "textColor" => ($header) ? '#'.$header : '',
  ],
  "ts" => time(),
  "uptime" => 1000 * (time() - round(strtok(exec("cat /proc/uptime"),' '))),
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
<!-- /myservers2 -->
