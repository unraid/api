<?

/**
 * Caveats to get the SSO login button to display
 * 
 * /usr/local/emhttp/auth-request.php must be updated to include the exact URLs of anything that is being loaded.
 * Otherwise, the request for the asset will be blocked and redirected to /login.
 * 
 * The modification of these files should be done via the plugin's install script.
 */
require_once("$docroot/plugins/dynamix.my.servers/include/state.php");
require_once("$docroot/plugins/dynamix.my.servers/include/web-components-extractor.php");

$serverState = new ServerState();

$wcExtractor = new WebComponentsExtractor();
echo $wcExtractor->getScriptTagHtml();
?>

<unraid-i18n-host>
    <unraid-sso-button ssoSubIds="<?= $serverState->ssoSubIds ?>"></unraid-sso-button>
</unraid-i18n-host>