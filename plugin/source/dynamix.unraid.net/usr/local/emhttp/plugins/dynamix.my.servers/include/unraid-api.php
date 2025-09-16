<?PHP
/* Copyright 2005-2023, Lime Technology
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */
$cli = php_sapi_name() == 'cli';

$docroot ??= ($_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp');
require_once "$docroot/webGui/include/Wrappers.php";

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
  'status',
  'report',
  'wanip'
];

$command = 'none';
$param1 = '';
if ($cli) {
  if ($argc > 1) $command = $argv[1];
  if ($argc > 2) $param1 = $argv[2];
} else {
  $command = $_POST['command'];
  $param1 = $_POST['param1'] ?? '';
}
if (!in_array($command, $validCommands)) $command = 'none';

if (!file_exists('/usr/bin/unraid-api')) {
  response_complete(406, array('error' => 'Please reinstall the Unraid Connect plugin'));
}

$output = [];
$retval = null;

switch ($command) {
  case 'start':
    exec('unraid-api start 2>/dev/null', $output, $retval);
    $output = implode(PHP_EOL, $output);
    response_complete(200, array('result' => $output), $output);
    break;
  case 'restart':
    exec('/etc/rc.d/rc.unraid-api restart 2>&1', $output, $retval);
    $output = implode(PHP_EOL, $output);
    response_complete(200, array('success' => ($retval === 0), 'result' => $output, 'error' => ($retval !== 0 ? $output : null)), $output);
    break;
  case 'status':
    exec('unraid-api status 2>&1', $output, $retval);
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
  case 'wanip':
    $wanip = trim(http_get_contents("https://wanip4.unraid.net/"));
    response_complete(200, array('result' => $wanip), $wanip);
    break;
  case 'none':
    response_complete(406,  array('error' => 'Nothing to do'));
    break;
}
exit;
?>