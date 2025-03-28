<?php
$docroot ??= ($_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp');
$var = (array)parse_ini_file('state/var.ini');
require_once "$docroot/plugins/dynamix.my.servers/include/state.php";

$serverState = new ServerState();

header('Content-type: application/json');

echo $serverState->getServerStateJson();
