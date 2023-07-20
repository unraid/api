<?php
$docroot = $docroot ?? $_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp';

$var = (array)parse_ini_file('state/var.ini');

require_once "$docroot/webGui/include/Helpers.php";
require_once "$docroot/plugins/dynamix.my.servers/include/state.php";

header('Content-type: application/json');

echo json_encode($serverState);
