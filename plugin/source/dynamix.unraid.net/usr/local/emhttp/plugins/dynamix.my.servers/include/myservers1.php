<!-- myservers1 -->
<style>
#header {
  z-index: 102 !important;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -ms-flex-pack: justify;
  justify-content: space-between;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
}
connect-user-profile {
  font-size: 16px;
  margin-left: auto;
  height: 100%;
}
</style>
<?
/**
 * @todo create web component env switcher liker upcEnv(). If we utilize manifest.json then we'll be switching its path.
 */
$myservers_flash_cfg_path='/boot/config/plugins/dynamix.my.servers/myservers.cfg';
$myservers = file_exists($myservers_flash_cfg_path) ? @parse_ini_file($myservers_flash_cfg_path,true) : [];
// extract web component JS file from manifest
$jsonManifest = file_get_contents('/usr/local/emhttp/plugins/dynamix.my.servers/webComponents/manifest.json');
$jsonManifestData = json_decode($jsonManifest, true);
$webComponentJsFile = $jsonManifestData["connect-components.client.mjs"]["file"];
// add the web component source to the DOM
$localSourceBasePath = '/plugins/dynamix.my.servers/webComponents/';
$localSourceJs = $localSourceBasePath . $webComponentJsFile;
echo '<script defer src="' . $localSourceJs . '"></script>';
?>
<!-- /myservers1 -->
