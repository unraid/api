<!-- myservers2 -->
<?include "$docroot/plugins/dynamix.my.servers/include/upcTranslations.php"?>

<?
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
// note: $myservers variable defined in myservers1.php, by parsing myservers.cfg

$configErrorEnum = [ // used to map $var['configValid'] value to mimic unraid-api's `configError` ENUM
  "error" => 'UNKNOWN_ERROR',
  "invalid" => 'INVALID',
  "nokeyserver" => 'NO_KEY_SERVER',
  "withdrawn" => 'WITHDRAWN',
];
$nginx = parse_ini_file('/var/local/emhttp/nginx.ini');

$plgInstalled = '';
if (!file_exists('/var/lib/pkgtools/packages/dynamix.unraid.net') && !file_exists('/var/lib/pkgtools/packages/dynamix.unraid.net.staging')) {
  $plgInstalled = ''; // base OS only, plugin not installed • show ad for plugin
} else {
  // plugin is installed but if the unraid-api file doesn't fully install it's a failed install
  if (file_exists('/var/lib/pkgtools/packages/dynamix.unraid.net')) $plgInstalled = 'dynamix.unraid.net.plg';
  if (file_exists('/var/lib/pkgtools/packages/dynamix.unraid.net.staging')) $plgInstalled = 'dynamix.unraid.net.staging.plg';
  // plugin install failed • append failure detected so we can show warning about failed install via UPC
  if (!file_exists('/usr/local/sbin/unraid-api')) $plgInstalled = $plgInstalled . '_installFailed';
}

// read flashbackup ini file
$flashbackup_ini = '/var/local/emhttp/flashbackup.ini';
$flashbackup_status = (file_exists($flashbackup_ini)) ? @parse_ini_file($flashbackup_ini) : [];

$serverstate = [ // feeds server vars to Vuex store in a slightly different array than state.php
  "avatar" => (!empty($myservers['remote']['avatar']) && $plgInstalled) ? $myservers['remote']['avatar'] : '',
  "config" => [
    'valid' => $var['configValid'] === 'yes',
    'error' => $var['configValid'] !== 'yes'
      ? (array_key_exists($var['configValid'], $configErrorEnum) ? $configErrorEnum[$var['configValid']] : 'UNKNOWN_ERROR')
      : null,
  ],
  "deviceCount" => $var['deviceCount'],
  "email" => $myservers['remote']['email'] ?? '',
  "extraOrigins" => explode(',', $myservers['api']['extraOrigins']??''),
  "flashproduct" => $var['flashProduct'],
  "flashvendor" => $var['flashVendor'],
  "flashBackupActivated" => empty($flashbackup_status['activated']) ? '' : 'true',
  "guid" => $var['flashGUID'],
  "hasRemoteApikey" => !empty($myservers['remote']['apikey']),
  "internalip" => ipaddr(),
  "internalport" => $_SERVER['SERVER_PORT'],
  "keyfile" => empty($var['regFILE'])? "" : str_replace(['+','/','='], ['-','_',''], trim(base64_encode(@file_get_contents($var['regFILE'])))),
  "osVersion" => $var['version'],
  "plgVersion" => $plgversion = file_exists('/var/log/plugins/dynamix.unraid.net.plg')
    ? trim(@exec('/usr/local/sbin/plugin version /var/log/plugins/dynamix.unraid.net.plg 2>/dev/null'))
    : ( file_exists('/var/log/plugins/dynamix.unraid.net.staging.plg')
        ? trim(@exec('/usr/local/sbin/plugin version /var/log/plugins/dynamix.unraid.net.staging.plg 2>/dev/null'))
        : 'base-'.$var['version'] ),
  "plgInstalled" => $plgInstalled,
  "protocol" => $_SERVER['REQUEST_SCHEME'],
  "reggen" => (int)$var['regGen'],
  "regGuid" => $var['regGUID'],
  "registered" => (!empty($myservers['remote']['username']) && $plgInstalled),
  "servername" => $var['NAME'],
  "site" => $_SERVER['REQUEST_SCHEME']."://".$_SERVER['HTTP_HOST'],
  "state" => strtoupper(empty($var['regCheck']) ? $var['regTy'] : $var['regCheck']),
  "ts" => time(),
  "username" => (!empty($myservers['remote']['username']) && $plgInstalled) ? $myservers['remote']['username'] : '',
  "wanFQDN" => $nginx['NGINX_WANFQDN'] ?? '',
];
/** @TODO - prop refactor needed. The issue is because the prop names share the same name as the vuex store variables
 * if we remove the props and deployed a UPC that doesn't rely on props anymore uses that don't have an updated version
 * of this file will have a non-working UPC.
 * apikey
 * apiVersion
 * csrf
 * expiretime
 * hideMyServers
 * plgPath
 * regWizTime
 * sendCrashInfo
 * serverdesc
 * servermodel
 * serverupdate
 * uptime
*/
?>
<unraid-user-profile
  apikey="<?=$myservers['upc']['apikey'] ?? ''?>"
  api-version="<?=$myservers['api']['version'] ?? ''?>"
  banner="<?=$display['banner'] ?? ''?>"
  bgcolor="<?=($backgnd) ? '#'.$backgnd : ''?>"
  csrf="<?=$var['csrf_token']?>"
  displaydesc="<?=($display['headerdescription']??''!='no') ? 'true' : ''?>"
  expiretime="<?=1000*($var['regTy']=='Trial'||strstr($var['regTy'],'expired')?$var['regTm2']:0)?>"
  hide-my-servers="<?=$plgInstalled ? '' : 'yes' ?>"
  locale="<?=($_SESSION['locale']) ? $_SESSION['locale'] : 'en_US'?>"
  locale-messages="<?=rawurlencode(json_encode($upc_translations, JSON_UNESCAPED_SLASHES, JSON_UNESCAPED_UNICODE))?>"
  metacolor="<?=($display['headermetacolor']??'') ? '#'.$display['headermetacolor'] : ''?>"
  plg-path="dynamix.my.servers"
  reg-wiz-time="<?=$myservers['remote']['regWizTime'] ?? ''?>"
  serverdesc="<?=$var['COMMENT']?>"
  servermodel="<?=$var['SYS_MODEL']?>"
  serverstate="<?=rawurlencode(json_encode($serverstate, JSON_UNESCAPED_SLASHES))?>"
  show-banner-gradient="<?=$display['showBannerGradient'] ?? 'yes'?>"
  textcolor="<?=($header) ? '#'.$header : ''?>"
  theme="<?=$display['theme']?>"
  uptime="<?=1000*(time() - round(strtok(exec("cat /proc/uptime"),' ')))?>"
  ></unraid-user-profile>
<!-- /myservers2 -->
