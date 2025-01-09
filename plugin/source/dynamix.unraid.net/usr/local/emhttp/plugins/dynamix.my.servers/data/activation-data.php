<?php
$docroot ??= ($_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp');

require_once "$docroot/plugins/dynamix.my.servers/include/activation-code-extractor.php";

$activationCodeExtractor = new ActivationCodeExtractor();
?>
<pre>
<? $activationCodeExtractor->debug(); ?>
</pre>
