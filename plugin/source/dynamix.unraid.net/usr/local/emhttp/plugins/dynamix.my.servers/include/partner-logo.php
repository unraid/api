<?php
/**
 * Display the partner logo that was installed with the activation code.
 */
$docroot ??= ($_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp');
$var = (array)parse_ini_file('state/var.ini');

require_once "$docroot/webGui/include/Wrappers.php";
require_once "$docroot/webGui/include/Helpers.php";
extract(parse_plugin_cfg('dynamix',true));
require_once "$docroot/plugins/dynamix.my.servers/include/activation-code-extractor.php";

$activationCodeExtractor = new ActivationCodeExtractor();
?>

<a href="<?= $activationCodeExtractor->getPartnerUrl() ?>" target="_blank" class="partner-logo">
  <?= $activationCodeExtractor->getPartnerLogoRenderString() ?>
</a>
