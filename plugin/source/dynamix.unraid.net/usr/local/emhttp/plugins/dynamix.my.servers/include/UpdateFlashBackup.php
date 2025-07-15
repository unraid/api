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
?>
<?

// set GIT_OPTIONAL_LOCKS=0 globally to reduce/eliminate writes to /boot
putenv('GIT_OPTIONAL_LOCKS=0');

$cli = php_sapi_name()=='cli';

$docroot ??= ($_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp');
require_once "$docroot/webGui/include/Wrappers.php";
require_once "$docroot/plugins/dynamix.my.servers/include/connect-config.php";

$isRegistered = ConnectConfig::isUserSignedIn();

// Read connection status from the new API status file
$statusFilePath = '/var/local/emhttp/connectStatus.json';
$connectionStatus = '';

if (file_exists($statusFilePath)) {
    $statusData = @json_decode(file_get_contents($statusFilePath), true);
    $connectionStatus = $statusData['connectionStatus'] ?? '';
}

$isConnected = ($connectionStatus === 'CONNECTED') ? true : false;

$flashbackup_ini = '/var/local/emhttp/flashbackup.ini';

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
  global $arrState,$flashbackup_ini;

  $arrState['loading'] = $loading;

  $text = "[flashbackup]\n";
  foreach ($arrState as $key => $value) {
    if ($value === false || $value === 'false') $value = 'no';
    if ($value === true || $value === 'true') $value = 'yes';
    $text .= "$key=" . $value . "\n";
  }
  $flashbackup_tmp = '/var/local/emhttp/flashbackup.new';
  file_put_contents($flashbackup_tmp, $text);
  rename($flashbackup_tmp, $flashbackup_ini);
}

function default_flash_backup_state() {
  global $arrState;

  $arrState = [
    'activated' => 'no',
    'uptodate' => 'no',
    'loading' => '',
    'error' => '',
    'remoteerror' => ''
  ];
}

function load_flash_backup_state() {
  global $arrState,$flashbackup_ini,$isRegistered;

  default_flash_backup_state();

  $arrNewState = (file_exists($flashbackup_ini)) ? @parse_ini_file($flashbackup_ini) : [];
  if ($arrNewState) {
    $arrState = array_merge($arrState, $arrNewState);
    $arrState['activated'] = ($arrState['activated'] === true || $arrState['activated'] === 'true') ? 'yes' : 'no';
    $arrState['uptodate'] = ($arrState['uptodate'] === true || $arrState['uptodate'] === 'true') ? 'yes' : 'no';
  }

  $arrState['registered'] = ($isRegistered) ? 'yes' : 'no';
}

function write_log($msg) {
  global $gitflash, $command;
  error_log('['.date("Y/m/d H:i:s e").'] '.$command.' '.$msg."\n\n", 3, $gitflash); 
}

function exec_log($cmd, &$output = [], &$retval = 0) {
  try {
    exec($cmd.' 2>&1', $output, $retval);

    if ($retval === 0) {
      write_log(' Command  \''.$cmd.'\' exited with code '.$retval);
    } else {
      write_log(' Command \''.$cmd.'\' exited with code '.$retval.', response was:'."\n".implode("\n", $output));
    }
  } catch (Exception $e) {
    write_log(' Command \''.$cmd.'\' exited with code '.$retval.' with exception:'."\n".$e->getMessage());
  }
}

function set_git_config($name, $value) {
  $config_output = $return_var = null;
  exec('git -C /boot config --get '.escapeshellarg($name).' 2>&1', $config_output, $return_var);
  if (empty($config_output) || strcmp($config_output[0], $value) !== 0) {
    exec_log('git -C /boot config '.escapeshellarg($name).' '.escapeshellarg($value));
  }
}

function readFromFile($file): string {
  $text = "";
  if (file_exists($file) && filesize($file) > 0) {
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

// rename /boot/.git to /boot/.git{random}, then start process to delete in background
function deleteLocalRepo() {
  global $arrState;

  $mainGitDir = '/boot/.git';
  $tmpGitDir = '/boot/.git'.rand();
  if (is_dir($mainGitDir)) {
    rename($mainGitDir, $tmpGitDir);
    exec('echo "rm -rf '.$tmpGitDir.' &>/dev/null" | at -q f -M now &>/dev/null');
    write_log("local repo deleted");
  }

  // reset state
  $arrState['activated'] = 'no';
  $arrState['uptodate'] = 'no';
  $arrState['loading'] = '';
  $arrState['error'] = '';
  $arrState['remoteerror'] = '';
  save_flash_backup_state();
}

$validCommands = [
  'init', //default
  'activate',
  'status',
  'update',
  'update_nolimit',
  'flush',
  'deactivate'
];

$command = 'init';
if ($cli) {
  if ($argc > 1) $command = $argv[1];
  if ($argc > 2) $commitmsg = $argv[2];
} else {
  $command = $_POST['command']??'';
  $commitmsg = $_POST['commitmsg']??'';
}
if (!in_array($command, $validCommands)) $command = 'init';
if (empty($commitmsg)) {
  $commitmsg = 'Config change';
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

// don't interrupt activate command
if ($command != 'activate' && $loadingMessage == 'Activating') {
  exit('{}');
}

// if already processing, bail
if ($arrState['loading'] == 'Processing' && $loadingMessage == 'Processing') {
  exit('{}');
}

// if git is still running, bail
exec("pgrep -f '^git -C /boot' -c 2>&1", $pgrep_output, $retval);
if ($pgrep_output[0] != "0") {
  exit('{}');
}

// check if signed-in
if (!$isRegistered) {
  default_flash_backup_state();
  response_complete(406,  array('error' => 'Must be signed in to Unraid Connect to use Flash Backup'));
}

// check if connected to Unraid Connect Cloud
if (!$isConnected) {
  default_flash_backup_state();
  response_complete(406,  array('error' => 'Must be connected to Unraid Connect Cloud to use Flash Backup'));
}

// ensure keys.lime-technology.com is not hard-coded in the hosts file
exec('if grep -q "keys.lime-technology.com" /etc/hosts &>/dev/null; then sed -i "/keys.lime-technology.com/d" /etc/hosts &>/dev/null; fi');

// keyfile
if (!file_exists('/var/local/emhttp/var.ini')) {
  response_complete(406, array('error' => 'Machine still booting'));
}
$var = parse_ini_file("/var/local/emhttp/var.ini");
$keyfile = empty($var['regFILE']) ? false : @file_get_contents($var['regFILE']);
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

if (!empty($loadingMessage)) {
  save_flash_backup_state($loadingMessage);
}

// check if being rate limited by keyserver
$rateLimitFile = "/var/log/gitratelimit";
if (file_exists($rateLimitFile)) {
  $rateLimitRetryTimestamp = (int)@file_get_contents($rateLimitFile);
  $rateLimitRetryAfter = $rateLimitRetryTimestamp - time();
  if ($rateLimitRetryAfter > 0) { 
    if (empty($arrState['remoteerror'])) {
      $arrState['remoteerror'] = 'You are being rate limited - try again in '.$rateLimitRetryAfter.' seconds.';
    }
    response_complete(406,  array('error' => $arrState['remoteerror']));
  } else {
    unlink($rateLimitFile);
    $arrState['remoteerror'] = "";
    save_flash_backup_state();
  }
}

// if flush command, invoke our background rc.flash_backup to flush
if ($command == 'flush') {
  exec('/etc/rc.d/rc.flash_backup flush &>/dev/null');
  response_complete(200, '{}');
}

if ($command == 'deactivate') {
  exec('/etc/rc.d/rc.flash_backup stop &>/dev/null');
  deleteLocalRepo();
  response_complete(200, '{}');
}

// determine size of local repo
$maxRepoSize = 100 * 1000; // 100 MB, for comparison without output of 'du -s'
$repoDelFlag = '/boot/config/plugins/dynamix.my.servers/repodeleted';
$output = [];
if (file_exists('/boot/.git')) exec('du -s /boot/.git/ | cut -f 1', $output);
$repoSize = ($output && $output[0]) ? intval($output[0]) : 0;
if ($repoSize > $maxRepoSize) {
  // the local repo is too large
  $okToDelRepo = true;
  if (file_exists($repoDelFlag)) {
    // the local repo is too large, but we have already auto-deleted it in the past. determine how long ago this happened
    $repoDelTime = intval(@trim(@file_get_contents($repoDelFlag))); // epoch
    $repoAge = round((time()-$repoDelTime)/(60*60*24)); // days
    $repoMaxAge = 90; // days
    if ($repoAge < $repoMaxAge) {
      // the local repo was deleted and recreated less than repoMaxAge days ago, do not delete
      write_log("local repo is too large ($repoSize > $maxRepoSize) but was auto-deleted recently ($repoAge < $repoMaxAge)");
      $okToDelRepo = false;
    }
  }
  if ($okToDelRepo) {
    // the local repo is too large, delete and reactivate it
    write_log("local repo is too large ($repoSize > $maxRepoSize), about to delete and reactivate");
    file_put_contents($repoDelFlag, time());
    exec('/etc/rc.d/rc.flash_backup stop &>/dev/null');
    deleteLocalRepo();
    // change command to 'activate' and continue script
    $command = 'activate';
    $loadingMessage = 'Activating';
    save_flash_backup_state($loadingMessage);
  }
} else {
  write_log("local repo size is acceptable ($repoSize < $maxRepoSize)");
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
  'version' => _var($var,'version'),
  'api_version' => _var($mystatus, 'version'),
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

if (empty($json)) {
  response_complete(406, $result);
}

// Show any warnings from keyserver
if (!empty($json['warn'])) {
  $arrState['remoteerror'] = $json['warn'];
}

// check if being rate limited by keyserver
if (!empty($json['retry_after'])) {
  // add five minute margin to ensure remote rate limit is cleared
  $rateLimitRetryAfter = $json['retry_after'] + 5*60;
  $rateLimitRetryTimestamp = time() + $rateLimitRetryAfter;
  file_put_contents($rateLimitFile, $rateLimitRetryTimestamp);
  if (empty($arrState['remoteerror'])) {
    $arrState['remoteerror'] = 'You are being rate limited - try again in '.$rateLimitRetryAfter.' seconds.';
  }
  response_complete(406,  array('error' => $arrState['remoteerror']));
}

if (empty($json['ssh_privkey']) || empty($json['ssh_pubkey'])) {
  response_complete(406, $result);
}

// save the public and private keys
if (!file_exists('/root/.ssh')) {
  mkdir('/root/.ssh', 0700);
}

$privkey_file='/root/.ssh/unraidbackup_id_ed25519';
$pubkey_file='/root/.ssh/unraidbackup_id_ed25519.pub';
if (!file_exists($privkey_file) || ($json['ssh_privkey'] != file_get_contents($privkey_file))) {
  file_put_contents($privkey_file, $json['ssh_privkey']);
  chmod($privkey_file, 0600);
}
if (!file_exists($pubkey_file) || ($json['ssh_pubkey'] != file_get_contents($pubkey_file))) {
  file_put_contents($pubkey_file, $json['ssh_pubkey']);
  chmod($pubkey_file, 0644);
}

// add configuration to use our keys
$sshconfig_file='/root/.ssh/config';
$sshconfig_fix=false;
if (!file_exists($sshconfig_file)) {
  $sshconfig_fix=true;
} else {
  // detect uncommented 'Host backup.unraid.net'
  preg_match_all('/^\s*[^#]?\s*Host backup.unraid.net/m', file_get_contents($sshconfig_file), $matches, PREG_SET_ORDER, 0);
  if (empty($matches)) {
    $sshconfig_fix=true;
  }
}
if ($sshconfig_fix) {
  file_put_contents($sshconfig_file, 'Host backup.unraid.net
IdentityFile ~/.ssh/unraidbackup_id_ed25519
IdentitiesOnly yes
', FILE_APPEND);
  chmod($sshconfig_file, 0644);
}

// add all of our server keys as known hosts
$arrKnownHosts = [
  'backup.unraid.net ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCg2CMfRk0Vmkmec04TlgHyZB4F/u+EyfL1BtrWQzu8p2DzRKZww0JXTxHfNc06kQ/EvRW6lkJUQX2eug7UgnRImenxusgMAYnxBCdj+txnzHQ6/JPpXtde54H8tpC8c6xV5BP8UVQ/whBskGIMeM5HTcvSd5cZa1+KaFanygQ20kM6YbZMP9M+UYG59USJs2XD9HP9Pcb4W18y1lMCU2PPrhxCK4dtZxe/903ir6jt3VXES1EV5q6uLAyPtEhB5sybr5a/P9dy41q0v/GxK12VNDJxywHx1muYuSilOXz5lB6KSc1lLKAtitgC5Q5K/A1akgdXY7MDPwnF/rji3jgF',
  'backup.unraid.net ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBKrKXKQwPZTY25MoveIw7fZ3IoZvvffnItrx6q7nkNriDMr2WAsoxu0DrU2QrSLH5zFF1ibv4tChS1hOpiYObiI=',
  'backup.unraid.net ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINw447tJ+nQ/dGz05Gn9VtzGZdXI7o+srED3Gi9kImY5'
];
$knownhosts_file='/root/.ssh/known_hosts';
foreach ($arrKnownHosts as $strKnownHost) {
  if (!file_exists($knownhosts_file) || strpos(file_get_contents($knownhosts_file),$strKnownHost) === false) {
    file_put_contents($knownhosts_file, $strKnownHost."\n", FILE_APPEND);
  }
}

// blow away existing repo if activate command
if ($command == 'activate' && file_exists('/boot/.git')) {
  deleteLocalRepo();
}

// ensure git repo is setup on the flash drive
if (!file_exists('/boot/.git/info/exclude')) {
  exec_log('git init /boot');
}

// setup a nice git description
$gitdesc_text='Unraid flash drive for '._var($var,'NAME')."\n";
$gitdesc_file='/boot/.git/description';
if (!file_exists($gitdesc_file) || (file_get_contents($gitdesc_file) != $gitdesc_text)) {
  file_put_contents($gitdesc_file, $gitdesc_text);
}

// configure git to use the noprivatekeys filter
set_git_config('filter.noprivatekeys.clean', '/usr/local/emhttp/plugins/dynamix.my.servers/scripts/git-noprivatekeys-clean');

// configure git to apply the noprivatekeys filter to wireguard config files
$gitattributes_text='# file managed by Unraid, do not modify
config/wireguard/*.cfg filter=noprivatekeys
config/wireguard/*.conf filter=noprivatekeys
config/wireguard/peers/*.conf filter=noprivatekeys
';
$gitattributes_file='/boot/.gitattributes';
if (!file_exists($gitattributes_file) || (file_get_contents($gitattributes_file) != $gitattributes_text)) {
  file_put_contents($gitattributes_file, $gitattributes_text);
}

// setup master git exclude file to specify what to include/exclude from repo
$gitexclude_text = '# file managed by Unraid, do not modify
# version 1.2

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
config/plugins/dynamix.file.integrity/logs
config/wireguard/peers/*.png
';

// find large files to exclude from flash backup
$oversize_files = $return_var = null;
exec('find /boot/config -type f -size +10M 2>/dev/null | sed "s|^/boot/||g" 2>/dev/null', $oversize_files, $return_var);
if ($oversize_files && is_array($oversize_files)) {
  $gitexclude_text .= "\n# Blacklist large files on this system\n".implode("\n", $oversize_files)."\n";
}

$gitexclude_file='/boot/.git/info/exclude';
if (!file_exists($gitexclude_file) || (file_get_contents($gitexclude_file) != $gitexclude_text)) {
  file_put_contents($gitexclude_file, $gitexclude_text);
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
// this is a client-side rate limit on git commits, unrelated to the keyserver rate limit
$cooldown = 3 * 60 * 60; // 180 mins / 3 hours
$maxCommitCount = 20;   // maxCommitCount per cooldown minutes
$commitCountFile = "/var/log/gitcount";
$time = time();
$commitCount = cleanupCounter($commitCountFile, $time);
if (!$ignoreRateLimit && $commitCount >= $maxCommitCount) {
  $arrState['remoteerror'] = 'Rate limited, will try again later';
  // log once every 10 minutes
  if (date("i") % 10 === 0) write_log($arrState['error'].'; '.$arrState['remoteerror']); 
  response_complete(406, array('error' => $arrState['remoteerror']));
} elseif ($arrState['remoteerror']??'' == 'Rate limited, will try again later') {
  // no longer rate limited, clear the 'remoteerror'
  $arrState['remoteerror'] = '';
}

// test which ssh port allows a connection (standard ssh port 22 or alternative port 443)
$SSH_PORT = '';
exec('timeout 17 ssh -o ConnectTimeout=15 -T git@backup.unraid.net 2>&1', $ssh_output, $return_var);
if ($return_var == 128) {
  $SSH_PORT = '22';
} else {
  exec('timeout 17 ssh -o ConnectTimeout=15 -p 443 -T git@backup.unraid.net 2>&1', $ssh_output, $return_var);
  if ($return_var == 128) {
    $SSH_PORT = '443';
  }
}
write_log('ssh_output '.implode($ssh_output));
if (empty($SSH_PORT)) {
  if ($loadingMessage == 'Activating') {
    // still syncing auth_keys on the serverside, ignore for activation
    $SSH_PORT = '22';
  } else {
    $arrState['loading'] = '';
    if (stripos(implode($ssh_output),'permission denied') !== false) {
      $arrState['error'] = ($isConnected) ? 'Permission Denied' : 'Permission Denied, ensure you are connected to Unraid Connect Cloud';
    } else {
      $arrState['error'] = 'Unable to connect to backup.unraid.net:22';
    }
    response_complete(406, array('error' => $arrState['error']));
  }
} else if ($arrState['error'] == 'Unable to connect to backup.unraid.net:22') {
  // can now connect, clear previous error
  $arrState['error'] = '';
}

// ensure upstream git server is configured and in-sync
if (strpos(file_get_contents('/boot/.git/config'),'[remote "origin"]') === false) {
  exec('git -C /boot remote add -f -t master -m master origin ssh://git@backup.unraid.net:'.$SSH_PORT.'/~/flash.git &>/dev/null');
} else if (strpos(file_get_contents('/boot/.git/config'),'ssh://git@backup.unraid.net:22/~/flash.git') === false) {
  exec('git -C /boot remote set-url origin ssh://git@backup.unraid.net:'.$SSH_PORT.'/~/flash.git &>/dev/null');
}

if ($command == 'activate') {
  $arrState['uptodate'] == 'no';

} else {
  // determine current status of local repo

  exec_log('git -C /boot reset origin/master');
  exec_log('git -C /boot checkout -B master origin/master');

  // establish status
  exec_log('git -C /boot status --porcelain', $status_output, $return_var);

  if ($return_var != 0) {
    // detect git submodule
    if (stripos(implode($status_output),'failed in submodule') !== false) {
      $arrState['loading'] = '';
      $arrState['error'] = 'git submodules are incompatible with our flash backup solution';
      response_complete(406, array('error' => $arrState['error']));
    }

    if (stripos(implode($status_output),'index file smaller than expected') !== false) {
      // repair git index
      exec_log('rm -f /boot/.git/index');
      exec_log('git -C /boot reset HEAD .');
      exec('git -C /boot status --porcelain 2>&1', $status_output, $return_var);
    }
  }

  if ($return_var != 0) {
    write_log('bailing - status return_var is '.$return_var); 
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
    } else {
      $arrState['error'] = '';
    }
  }

  if ($arrState['error'] != 'Failed to sync flash backup') {
    $arrState['error'] = '';
  }

  // detect corruption #1
  exec_log('git -C /boot show --summary', $show_output, $return_var);
  if ($return_var != 0) {
    if (stripos(implode($show_output),'fatal: your current branch appears to be broken') !== false) {
      $arrState['error'] = 'Error: Backup corrupted';
      exec('/etc/rc.d/rc.flash_backup stop &>/dev/null');
    }
  }

  if ($command == 'status') {
    $data = implode("\n", $status_output);
    response_complete($httpcode, array('data' => $data), $data);
  }

} // end check for ($command == 'activate')

if ($command == 'update' || $command == 'activate') {

  // note: this section only runs if there are changes detected  
  if ($arrState['uptodate'] == 'no') {
    // increment git commit counter
    appendToFile($commitCountFile, $time."\n");

    // find files that are in repo but should not be, according to /boot/.git/info/exclude and various .gitignore files
    $invalid_files = $return_var = null;
    exec_log('git -C /boot ls-files --cached --ignored --exclude-standard', $invalid_files, $return_var);
    foreach ((array) $invalid_files as $invalid_file) {
      // remove each of these files from the repo
      // this prevents future changes from being tracked but does not remove the file from history.
      exec_log("git -C /boot rm --cached --ignore-unmatch '$invalid_file'");
    }

    // add and commit all file changes
    exec_log('git -C /boot add -A');
    exec_log('git -C /boot commit -m ' . escapeshellarg($commitmsg));

    // push changes upstream    
    exec_log('git -C /boot push --force --set-upstream origin master', $push_output, $return_var);
    if ($return_var != 0) {
      // check for permission denied
      if (stripos(implode($push_output),'permission denied') !== false) {
        $arrState['error'] = ($isConnected) ? 'Permission Denied' : 'Permission Denied, ensure you are connected to Unraid Connect Cloud';
      } elseif (stripos(implode($push_output),'fatal: loose object') !== false && stripos(implode($push_output),'is corrupt') !== false) {
        // detect corruption #2
        $arrState['error'] = 'Error: Backup corrupted';
        exec('/etc/rc.d/rc.flash_backup stop &>/dev/null');
      } else {
        $arrState['error'] = 'Failed to sync flash backup';
      }
      response_complete($httpcode, '{}');
    }
    $arrState['uptodate'] = 'yes';
    $arrState['error'] = '';
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
