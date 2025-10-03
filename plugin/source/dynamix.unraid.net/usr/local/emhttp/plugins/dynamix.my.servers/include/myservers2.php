<?php
/* Copyright 2005-2023, Lime Technology
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */
$docroot ??= ($_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp');
require_once("$docroot/plugins/dynamix.my.servers/include/state.php");

$serverState = new ServerState();
$locale = $_SESSION['locale'] ?? 'en_US';
?>
<script>
window.LOCALE = <?= json_encode($locale, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;
</script>
<unraid-user-profile server="<?= $serverState->getServerStateJsonForHtmlAttr() ?>"></unraid-user-profile>
