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
$cli = php_sapi_name() == 'cli';

$docroot = $docroot ?? $_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp';

/**
 * @name response_complete
 * @param {HTTP Response Status Code} $httpcode https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 * @param {String|Array} $result - strings are assumed to be encoded JSON. Arrays will be encoded to JSON.
 * @param {String} $cli_success_msg
 */
function response_complete($httpcode, $result, $cli_success_msg='') {
  global $cli;
  $mutatedResult = is_array($result) ? json_encode($result) : $result;
  if ($cli) {
    $json = @json_decode($mutatedResult,true);
    if (!empty($json['error'])) {
      echo 'Error: '.$json['error'].PHP_EOL;
      exit(1);
    }
    exit($cli_success_msg.PHP_EOL);
  }
  header('Content-Type: application/json');
  http_response_code($httpcode);
  exit((string)$mutatedResult);
}

$validCommands = [
  'start',
  'restart',
  'stop',
  'report'
];

$command = 'none';
$param1 = '';
if ($cli) {
  if ($argc > 1) $command = $argv[1];
  if ($argc > 2) $param1 = $argv[2];
} else {
  $command = $_POST['command'];
  $param1 = $_POST['param1'];
}
if (!in_array($command, $validCommands)) $command = 'none';

if (!file_exists('/usr/local/sbin/unraid-api') || !file_exists('/usr/local/bin/unraid-api/unraid-api')) {
  response_complete(406, array('error' => 'Please reinstall the My Servers plugin'));
}

switch ($command) {
  case 'start':
    exec('unraid-api start 2>/dev/null', $output, $retval);
    $output = implode(PHP_EOL, $output);
    response_complete(200, array('result' => $output), $output);
    break;
  case 'restart':
    exec('unraid-api restart 2>/dev/null', $output, $retval);
    $output = implode(PHP_EOL, $output);
    response_complete(200, array('result' => $output), $output);
    break;
  case 'stop':
    exec('unraid-api stop 2>/dev/null', $output, $retval);
    $output = implode(PHP_EOL, $output);
    response_complete(200, array('result' => $output), $output);
    break;
  case 'report':
    $flag = ($param1 && ($param1=='-v' || $param1=='-vv'))
      ? ($param1=='-vv' ? '-vv' : '-v')
      : '';
    exec("unraid-api report {$flag} —-raw 2>/dev/null", $output, $retval);
    $output = implode(PHP_EOL, $output);
    response_complete(200, array('result' => $output), $output);
    break;
  case 'none':
    response_complete(406,  array('error' => 'Nothing to do'));
    break;
}
exit;
?>