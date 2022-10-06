<?PHP
/* Copyright 2005-2021, Lime Technology
 * Copyright 2012-2021, Bergware International.
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

// set GIT_OPTIONAL_LOCKS=0 globally to reduce/eliminate writes to /boot
putenv('GIT_OPTIONAL_LOCKS=0');

$cli = php_sapi_name()=='cli';

$docroot = $docroot ?? $_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp';

if (file_exists('/boot/config/plugins/dynamix.my.servers/myservers.cfg')) {
  @extract(parse_ini_file('/boot/config/plugins/dynamix.my.servers/myservers.cfg',true));
}
if (empty($remote)) {
  $remote = [
    "apikey" => "",
    "username" => "",
    "avatar" => "",
    "wanaccess" => "no",
    "wanport" => "443"
  ];
}

/**
 * @name response_complete
 * @param {HTTP Response Status Code} $httpcode https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 * @param {String|Array} $result - strings are assumed to be encoded JSON. Arrays will be encoded to JSON.
 * @param {String} $cli_success_msg
 */
function response_complete($httpcode, $result, $cli_success_msg='') {
  global $cli;

  save_flash_backup_state();

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

function save_flash_backup_state($loading='') {
  global $arrState;

  $arrState['loading'] = $loading;

  $text = "[flashbackup]\n";
  foreach ($arrState as $key => $value) {
    if ($value === false || $value === 'false') $value = 'no';
    if ($value === true || $value === 'true') $value = 'yes';
    $text .= "$key=" . $value . "\n";
  }
  file_put_contents('/var/local/emhttp/flashbackup.new', $text);
  rename('/var/local/emhttp/flashbackup.new', '/var/local/emhttp/flashbackup.ini');
}

function load_flash_backup_state() {
  global $remote;
  global $arrState;

  $arrState = [
    'activated' => 'no',
    'uptodate' => 'no',
    'loading' => ''
  ];

  $arrNewState = false;
  if (file_exists('/var/local/emhttp/flashbackup.ini')) {
    $arrNewState = parse_ini_file('/var/local/emhttp/flashbackup.ini');
  }
  if ($arrNewState !== false) {
    $arrState = array_merge($arrState, $arrNewState);
    $arrState['activated'] = ($arrState['activated'] === true || $arrState['activated'] === 'true') ? 'yes' : 'no';
    $arrState['uptodate'] = ($arrState['uptodate'] === true || $arrState['uptodate'] === 'true') ? 'yes' : 'no';
  }

  $arrState['registered'] = !empty($remote['username']) ? 'yes' : 'no';
}

function exec_log($command, &$output = [], &$retval = 0) {
  global $arrState, $gitflash;

  try {
    exec($command.' 2>&1', $output, $retval);

    if ($retval === 0) {
      error_log('['.date("Y/m/d H:i:s e").'] Command \''.$command.'\' exited with code '.$retval."\n\n", 3, $gitflash); 
    } else {
      error_log('['.date("Y/m/d H:i:s e").'] Command \''.$command.'\' exited with code '.$retval.', response was:'."\n".implode("\n", $output)."\n\n", 3, $gitflash); 
    }
  } catch (Exception $e) {
    error_log('['.date("Y/m/d H:i:s e").'] Command \''.$command.'\' exited with code '.$retval.' with exception:'."\n".$e->getMessage()."\n\n", 3, $gitflash); 
  }
}

function set_git_config($name, $value) {
  $config_output = $return_var = null;
  exec('git -C /boot config --get '.escapeshellarg($name).' 2>&1', $config_output, $return_var);
  if (strcmp($config_output[0], $value) !== 0) {
    exec_log('git -C /boot config '.escapeshellarg($name).' '.escapeshellarg($value));
  }
}

function readFromFile($file): string {
  $text = "";
  if (file_exists($file)) {
      $fp = fopen($file,"r");
      if (flock($fp, LOCK_EX)) {
          $text = fread($fp, filesize($file));
          flock($fp, LOCK_UN);
          fclose($fp);
      }
  }
  return $text;
}

function appendToFile($file, $text): void {
  $fp = fopen($file,"a");
  if (flock($fp, LOCK_EX)) {
      fwrite($fp, $text);
      fflush($fp);
      flock($fp, LOCK_UN);
      fclose($fp);
  }
}

function writeToFile($file, $text): void {
  $fp = fopen($file,"w");
  if (flock($fp, LOCK_EX)) {
      fwrite($fp, $text);
      fflush($fp);
      flock($fp, LOCK_UN);
      fclose($fp);
  }
}

// Source: https://stackoverflow.com/a/2524761
function isValidTimeStamp($timestamp)
{
  return ((string) (int) $timestamp === $timestamp)
      && ($timestamp <= PHP_INT_MAX)
      && ($timestamp >= ~PHP_INT_MAX);
}

function cleanupCounter(string $dataFile, int $time): int {
  global $cooldown;

  // Read existing dataFile
  @mkdir(dirname($dataFile), 0755);
  $dataText = readFromFile($dataFile);
  $data = explode("\n", trim($dataText));

  // Remove entries older than $cooldown minutes, and entries that are not timestamps
  $updateDataFile = false;
  foreach ((array) $data as $key => $value) {
      if ( !isValidTimeStamp($value) || ($time - $value > $cooldown) || ($value > $time) ) {
          unset ($data[$key]);
          $updateDataFile = true;
      }
  }

  // Save data to disk
  if ($updateDataFile) {
      $dataText = implode("\n", $data)."\n";
      writeToFile($dataFile, $dataText);
  }
  return count($data);
}

$validCommands = [
  'init', //default
  'activate',
  'status',
  'update',
  'update_nolimit',
  'flush',
  'reinit',
  'deactivate'
];

if ($cli) {
  if ($argc > 1) $command = $argv[1];
  if ($argc > 2) $commitmsg = $argv[2];
} else {
  $command = $_POST['command'];
  $commitmsg = $_POST['commitmsg'];
}
if (!in_array($command, $validCommands)) $command = 'init';
if (empty($commitmsg)) {
  if ($command == 'reinit') {
    $commitmsg = 'Initial commit';
  } else {
    $commitmsg = 'Config change';
  }
}
$ignoreRateLimit = false;
if ($command == 'update_nolimit') {
  $ignoreRateLimit = true;
  $command = 'update';
}

$loadingMessage = '';

switch ($command) {
  case 'activate':
    $loadingMessage = 'Activating';
    break;
  case 'deactivate':
    $loadingMessage = 'Deactivating';
    break;
  case 'update':
  case 'update_nolimit':
  case 'flush':
    $loadingMessage = 'Processing';
    break;
  case 'reinit':
    $loadingMessage = 'Reinitializing';
    break;
  case 'status':
    $loadingMessage = 'Loading';
    break;
}

// rotate gitflash log file so it doesn't get too large
$gitflash = '/var/log/gitflash';
if (@filesize($gitflash) > 100000) { // 100kb
  if (file_exists($gitflash."1")) unlink($gitflash."1");
  rename($gitflash, $gitflash."1");
}

load_flash_backup_state();

// check if signed-in
if (empty($remote['username'])) {
  response_complete(406,  array('error' => 'Must be signed in to My Servers to use Flash Backup'));
}

// keyfile
if (!file_exists('/var/local/emhttp/var.ini')) {
  response_complete(406, array('error' => 'Machine still booting'));
}
$var = parse_ini_file("/var/local/emhttp/var.ini");
$keyfile = @file_get_contents($var['regFILE']);
if ($keyfile === false) {
  response_complete(406, array('error' => 'Registration key required'));
}
$keyfile = @base64_encode($keyfile);

// check if activated
if ($command != 'activate') {
  $config_output = $return_var = null;
  exec('git -C /boot config --get remote.origin.url 2>&1', $config_output, $return_var);
  if (($return_var != 0) || (strpos($config_output[0],'backup.unraid.net') === false)) {
    $arrState['activated'] = 'no';
    response_complete(406, array('error' => 'Not activated'));
  } else {
    $arrState['activated'] = 'yes';
  }
}

// if flush command, invoke our background rc.flash_backup to flush
if ($command == 'flush') {
  exec('/etc/rc.d/rc.flash_backup flush &>/dev/null');
  response_complete(200, '{}');
}

if (!empty($loadingMessage)) {
  save_flash_backup_state($loadingMessage);
}

// if deactivate command, just remove our origin
if ($command == 'deactivate') {
  exec_log('git -C /boot remote remove origin');
  exec('/etc/rc.d/rc.flash_backup stop &>/dev/null');
  response_complete(200, '{}');
}

// build a list of sha256 hashes of the bzfiles
$bzfilehashes = [];
$allbzfiles = ['bzimage','bzfirmware','bzmodules','bzroot','bzroot-gui'];
foreach ($allbzfiles as $bzfile) {
  if (!file_exists("/boot/$bzfile")) {
    response_complete(406, array('error' => 'missing /boot/'.$bzfile));
  }
  $sha256 = trim(@file_get_contents("/boot/$bzfile.sha256"));
  if (strlen($sha256) != 64) {
    $sha256 = hash_file('sha256', "/boot/$bzfile");
    file_put_contents("/boot/$bzfile.sha256", $sha256."\n");
  }
  $bzfilehashes[] = $sha256;
}

$ch = curl_init('https://keys.lime-technology.com/backup/flash/activate');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, [
  'keyfile' => $keyfile,
  'version' => $var['version'],
  'bzfiles' => implode(',', $bzfilehashes)
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($result === false) {
  response_complete(500, array('error' => $error));
}

$json = json_decode($result, true);
if (empty($json) || empty($json['ssh_privkey'])) {
  response_complete(406, $result);
}

// Show any warnings from the key-server
if (!empty($json['warn'])) {
  $arrState['remoteerror'] = $json['warn'];
}

// save the public and private keys
if (!file_exists('/root/.ssh')) {
  mkdir('/root/.ssh', 0700);
}

if ($json['ssh_privkey'] != file_get_contents('/root/.ssh/unraidbackup_id_ed25519')) {
  file_put_contents('/root/.ssh/unraidbackup_id_ed25519', $json['ssh_privkey']);
  chmod('/root/.ssh/unraidbackup_id_ed25519', 0600);
  file_put_contents('/root/.ssh/unraidbackup_id_ed25519.pub', $json['ssh_pubkey']);
  chmod('/root/.ssh/unraidbackup_id_ed25519.pub', 0644);
}

// add configuration to use our keys
if (!file_exists('/root/.ssh/config') || strpos(file_get_contents('/root/.ssh/config'),'Host backup.unraid.net') === false) {
  file_put_contents('/root/.ssh/config', 'Host backup.unraid.net
IdentityFile ~/.ssh/unraidbackup_id_ed25519
IdentitiesOnly yes
', FILE_APPEND);
  chmod('/root/.ssh/config', 0644);
}

// add our server as a known host
$strKnownHost = 'backup.unraid.net,54.70.72.154 ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBKrKXKQwPZTY25MoveIw7fZ3IoZvvffnItrx6q7nkNriDMr2WAsoxu0DrU2QrSLH5zFF1ibv4tChS1hOpiYObiI='."\n";
if (!file_exists('/root/.ssh/known_hosts') || strpos(file_get_contents('/root/.ssh/known_hosts'),$strKnownHost) === false) {
  file_put_contents('/root/.ssh/known_hosts', $strKnownHost, FILE_APPEND);
}

// blow away existing repo if reinit command
if ( ($command == 'activate' || $command == 'reinit') && file_exists('/boot/.git')) {
  exec_log('rm -rf /boot/.git');
}

// ensure git repo is setup on the flash drive
if (!file_exists('/boot/.git/info/exclude')) {
  exec_log('git init /boot');
}

// setup a nice git description
if (!file_exists('/boot/.git/description') || strpos(file_get_contents('/boot/.git/description'),$var['NAME']) === false) {
  file_put_contents('/boot/.git/description', 'Unraid flash drive for '.$var['NAME']."\n");
}

// configure git to use the noprivatekeys filter
set_git_config('filter.noprivatekeys.clean', '/usr/local/emhttp/plugins/dynamix.my.servers/scripts/git-noprivatekeys-clean');

// configure git to apply the noprivatekeys filter to wireguard config files
if (!file_exists('/boot/.gitattributes') || strpos(file_get_contents('/boot/.gitattributes'),'noprivatekeys') === false) {
  file_put_contents('/boot/.gitattributes', '# file managed by Unraid, do not modify
config/wireguard/*.cfg filter=noprivatekeys
config/wireguard/*.conf filter=noprivatekeys
config/wireguard/peers/*.conf filter=noprivatekeys
');
}

// setup git ignore for files we dont need in the flash backup
if (!file_exists('/boot/.git/info/exclude') || strpos(file_get_contents('/boot/.git/info/exclude'),'# version 1.0') === false) {
  file_put_contents('/boot/.git/info/exclude', '# file managed by Unraid, do not modify
# version 1.0

# Blacklist everything
/*

# Whitelist selected root files
!*.sha256
!changes.txt
!license.txt
!startup.nsh

!EFI*/
EFI*/boot/*
!EFI*/boot/syslinux.cfg

!syslinux/
syslinux/*
!syslinux/syslinux.cfg
!syslinux/syslinux.cfg-

# Whitelist entire config directory
!config/
#  except for selected files
config/drift
config/forcesync
config/plugins/unRAIDServer.plg
config/random-seed
config/shadow
config/smbpasswd
config/plugins/**/*.tgz
config/plugins/**/*.txz
config/plugins/**/*.tar.bz2
config/plugins-error
config/plugins-old-versions
config/plugins/dockerMan/images
config/wireguard/peers/*.png
');
}

// ensure git user is configured
set_git_config('user.email', 'gitbot@unraid.net');
set_git_config('user.name', 'gitbot');

// ensure dns can resolve backup.unraid.net
if (! checkdnsrr("backup.unraid.net","A") ) {
  $arrState['loading'] = '';
  $arrState['error'] = 'DNS is unable to resolve backup.unraid.net';
  response_complete(406, array('error' => $arrState['error']));
}

// bail if too many recent git updates. 
$cooldown = 3 * 60 * 60; // 180 mins / 3 hours
$maxCommitCount = 20;   // maxCommitCount per cooldown minutes
$commitCountFile = "/var/log/gitcount";
$time = time();
$commitCount = cleanupCounter($commitCountFile, $time);
if (!$ignoreRateLimit && $commitCount >= $maxCommitCount) {
  $arrState['error'] = 'Rate limited, will try again later';
  # log once every 10 minutes
  if (date("i") % 10 === 0) error_log('['.date("Y/m/d H:i:s e").'] '.$arrState['error']."\n", 3, $gitflash); 
  response_complete(406, array('error' => $arrState['error']));
}

// test which ssh port allows a connection (standard ssh port 22 or alternative port 443)
$SSH_PORT = '';
exec('timeout 5 bash -c "</dev/tcp/backup.unraid.net/22"', $status_output, $return_var);
if ($return_var == 0) {
  $SSH_PORT = '22';
} else {
  exec('timeout 5 bash -c "</dev/tcp/backup.unraid.net/443"', $status_output, $return_var);
  if ($return_var == 0) {
    $SSH_PORT = '443';
  }
}
if (empty($SSH_PORT)) {
  $arrState['loading'] = '';
  $arrState['error'] = 'Unable to connect to backup.unraid.net:22';
  response_complete(406, array('error' => $arrState['error']));
} else if ($arrState['error'] == 'Unable to connect to backup.unraid.net:22') {
  $arrState['error'] = '';
}

// ensure upstream git server is configured and in-sync
if (strpos(file_get_contents('/boot/.git/config'),'[remote "origin"]') === false) {
  exec('git -C /boot remote add -f -t master -m master origin ssh://git@backup.unraid.net:'.$SSH_PORT.'/~/flash.git &>/dev/null');
} else if (strpos(file_get_contents('/boot/.git/config'),'ssh://git@backup.unraid.net:22/~/flash.git') === false) {
  exec('git -C /boot remote set-url origin ssh://git@backup.unraid.net:'.$SSH_PORT.'/~/flash.git &>/dev/null');
}

if ($command != 'reinit') {
  exec_log('git -C /boot reset origin/master');
  exec_log('git -C /boot checkout -B master origin/master');
}

// establish status
exec('git -C /boot status --porcelain 2>&1', $status_output, $return_var);

if ($return_var != 0) {
  // detect git submodule
  foreach ($status_output as $status_line) {
    if (strpos($status_line,'failed in submodule') !== false) {
      $arrState['loading'] = '';
      $arrState['error'] = 'git submodules are incompatible with our flash backup solution';
      response_complete(406, array('error' => $arrState['error']));
    }
  }

  if (strpos($status_output[0],'index file smaller than expected') !== false) {
    // repair git index
    exec_log('rm -f /boot/.git/index');
    exec_log('git -C /boot reset HEAD .');
    exec('git -C /boot status --porcelain 2>&1', $status_output, $return_var);
  }
}

if ($return_var != 0) {
  $arrState['loading'] = '';
  $arrState['error'] = $status_output[0];
  response_complete(406, array('error' => $arrState['error']));
}

$arrState['uptodate'] = empty($status_output) ? 'yes' : 'no';

// check for any pending commits
if ($arrState['uptodate'] == 'yes') {
  // no untracked files; check if there are pending commits
  exec('git -C /boot rev-list origin/master..master --count 2>&1', $revlist_output);
  if (trim($revlist_output[0]) != '0') {
    $arrState['uptodate'] = 'no';
  }
}

if ($arrState['error'] != 'Failed to sync flash backup') {
  $arrState['error'] = '';
}

if ($command == 'status') {
  $data = implode("\n", $status_output);
  response_complete($httpcode, array('data' => $data), $data);
}

if (($command == 'update') || ($command == 'reinit')) {
  
  if ($arrState['uptodate'] == 'no') {
    // increment git commit counter
    appendToFile($commitCountFile, $time."\n");

    // add and commit all file changes
    if (!empty($status_output)) {
      exec_log('git -C /boot add -A');
      exec_log('git -C /boot commit -m ' . escapeshellarg($commitmsg));
    }
    // push changes upstream
    if ($command == 'reinit') {
      exec_log('git -C /boot push --force --set-upstream origin master', $push_output, $return_var);
    } else {
      exec_log('git -C /boot push --set-upstream origin master', $push_output, $return_var);
      if ($return_var != 0) {
        exec_log('git -C /boot push --force --set-upstream origin master', $push_output, $return_var);
      }
    }
    if ($return_var != 0) {
      $arrState['error'] = 'Failed to sync flash backup';
      response_complete($httpcode, '{}');
    }
    $arrState['uptodate'] = 'yes';
  }

  if ($arrState['error'] == 'Failed to sync flash backup') {
    // only clear the error state if it failed to connect before
    $arrState['error'] = '';
  }
}

if ($command == 'activate') {
  exec('/etc/rc.d/rc.flash_backup start &>/dev/null');
}

response_complete($httpcode, '{}');
?>
