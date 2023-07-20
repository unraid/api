<?php
$docroot = $docroot ?? $_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp';
require_once("$docroot/plugins/dynamix.my.servers/include/state.php");
// var_dump($serverState);
echo "<connect-user-profile server='" . json_encode($serverState) . "'></connect-user-profile>";
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
