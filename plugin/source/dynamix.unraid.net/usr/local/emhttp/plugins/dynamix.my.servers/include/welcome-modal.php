<?
/**
 * Caveats to get the modal to display
 * 
 * /usr/local/emhttp/auth-request.php must be updated to include the exact URLs of anything that is being loaded.
 * Otherwise, the request for the asset will be blocked and redirected to /login.
 * 
 * The modification of these files should be done via the plugin's install script.
 */
require_once("$docroot/plugins/dynamix.my.servers/include/state.php");
require_once("$docroot/plugins/dynamix.my.servers/include/web-components-extractor.php");

$wcExtractor = new WebComponentsExtractor();
echo $wcExtractor->getScriptTagHtml();
?>

<unraid-i18n-host>
    <unraid-welcome-modal></unraid-welcome-modal>
</unraid-i18n-host>

