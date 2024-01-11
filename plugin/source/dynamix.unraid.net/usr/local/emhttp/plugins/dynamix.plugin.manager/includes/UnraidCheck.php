<?PHP
/* Copyright 2005-2023, Lime Technology
 * Copyright 2012-2023, Bergware International.
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */
?>
<?
/**
 * Abstracting this code into a separate file allows us to use it in multiple places
 * without duplicating code.
 * 1. unraidcheck script can call this
 * 2. Unraid webgui web components and request this file
 * 3. Unraid webgui web components can request the json file directly
 *  - this is useful for the UPC to check for updates and display a model based on the value
 *  - `/plugins/dynamix.plugin.manager/scripts/unraidcheck.php?json=true`
 *  - note the json=true query param to receive a json response
 * 
 * @param json {string} - if set to true, will return the json response from the external request
 * @param altUrl {URL} - if set, will use this url instead of the default
 */
$docroot ??= ($_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp');
require_once "$docroot/webGui/include/Wrappers.php";
require_once "$docroot/plugins/dynamix.plugin.manager/include/PluginHelpers.php";

// Multi-language support
if (!function_exists('_')) {
  function _($text) {return $text;}
}

extract(parse_plugin_cfg('dynamix', true));

$var     = (array)@parse_ini_file('/var/local/emhttp/var.ini');
$script  = "$docroot/webGui/scripts/notify";
$server  = strtoupper(_var($var,'NAME','server'));
$output  = _var($notify,'plugin');
$plg     = '/var/log/plugins/unRAIDServer.plg';

$params  = [];
$params['branch']          = plugin('category', $plg, 'stable');
$params['current_version'] = plugin('version', $plg) ?: _var($var,'version');
if (_var($var,'regExp')) $params['update_exp'] = date('m-d-Y', _var($var,'regExp')*1);
$defaultUrl = 'https://releases.unraid.net/os';
// pass a param of altUrl to use the provided url instead of the default
$parsedAltUrl = (array_key_exists('altUrl',$_GET) && $_GET['altUrl']) ? $_GET['altUrl'] : false;
// if $parsedAltUrl pass to params
if ($parsedAltUrl) $params['altUrl'] = $parsedAltUrl;

$urlbase =  $parsedAltUrl ?? $defaultUrl;
$url     = $urlbase.'?'.http_build_query($params);

$response = "";
// use error handler to convert warnings from file_get_contents to errors so they can be captured
function warning_as_error($severity, $message, $filename, $lineno) {
  throw new ErrorException($message, 0, $severity, $filename, $lineno);
}
set_error_handler("warning_as_error");
try {
  $response = file_get_contents($url);
} catch (Exception $e) {
  $response = json_encode(array('error' => $e->getMessage()), JSON_PRETTY_PRINT);
}
restore_error_handler();

$json = json_decode($response, true);
if (!$json) {
  $response = json_encode(array('error' => 'Invalid response from '.$urlbase), JSON_PRETTY_PRINT);
  $json = json_decode($response, true);
}

// add params that were sent to $urlbase
$json['params']  = $params;

// store locally for UPC to access
$file = '/tmp/unraidcheck/result.json';
if (!is_dir(dirname($file))) mkdir(dirname($file));
file_put_contents($file, json_encode($json, JSON_PRETTY_PRINT));

// if we have a query param of json=true then just output the json
if (array_key_exists('json',$_GET) && $_GET['json']) {
  header('Content-Type: application/json');
  echo $response;
  exit(0);
}

// send notification if a newer version is available
if ($json && array_key_exists('isNewer',$json) && $json['isNewer']) {
  $newver = (array_key_exists('version',$json) && $json['version']) ? $json['version'] : 'unknown';
  exec("$script -e ".escapeshellarg("System - Unraid [$newver]")." -s ".escapeshellarg("Notice [$server] - Version update $newver")." -d ".escapeshellarg("A new version of Unraid is available")." -i ".escapeshellarg("normal $output")." -l '/Tools/Update' -x");
}
exit(0);
?>