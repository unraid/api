<?php
/**
 * Display the partner logo that was installed with the activation code.
 */
$docroot ??= ($_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp');

require_once "$docroot/plugins/dynamix.my.servers/include/activation-code-extractor.php";

$activationCodeExtractor = new ActivationCodeExtractor();
?>

<a href="<?= $activationCodeExtractor->getPartnerUrl() ?>" target="_blank" class="partner-logo">
  <?= $activationCodeExtractor->getPartnerLogoRenderString() ?>
</a>
