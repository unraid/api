#!/usr/bin/php
<?php
// Script Name: cleanup_operations.php
// Purpose: Handles cleanup operations for both install on unsupported OS and during removal
// 
// Usage:
//    ./cleanup_operations.php
//    ./cleanup_operations.php --debug

// Parse command line arguments
$debug = false;

if (isset($argv)) {
  foreach ($argv as $arg) {
    if ($arg === '--debug') {
      $debug = true;
    }
  }
}

// Debug function
function debug_log($message) {
  global $debug;
  if ($debug) {
    echo "[DEBUG] [cleanup_operations]: $message\n";
  }
}

// Get Unraid version and myservers config
$ver = @parse_ini_file('/etc/unraid-version', true)['version'];
$msini = @parse_ini_file('/boot/config/plugins/dynamix.my.servers/myservers.cfg', true);

debug_log("Unraid version: $ver");
debug_log("myservers.cfg exists: " . ($msini !== false ? "Yes" : "No"));

echo "\n";
echo "**********************************\n";
echo "🧹 CLEANING UP - may take a minute\n";
echo "**********************************\n";

if (file_exists("/boot/.git")) {
  if (file_exists("/etc/rc.d/rc.flash_backup")) {
    # stop flash backup service
    echo "\nStopping flash backup service. Please wait…";
    exec("/etc/rc.d/rc.flash_backup stop &>/dev/null");
  }
  if (file_exists("/usr/local/emhttp/plugins/dynamix.my.servers/include/UpdateFlashBackup.php")) {
    # deactivate and delete local flash backup
    echo "\nDeactivating flash backup. Please wait…";
    passthru("/usr/bin/php /usr/local/emhttp/plugins/dynamix.my.servers/include/UpdateFlashBackup.php deactivate");
  }
}

# set "Allow Remote Access" to "No" and sign out from Unraid Connect
if ($msini !== false) {
  # stop unraid-api
  echo "\nStopping unraid-api. Please wait…";
  $output = shell_exec("/etc/rc.d/rc.unraid-api stop --delete 2>&1'");
  if (!$output) {
    echo "Waiting for unraid-api to stop...\n";
    sleep(5); // Give it a few seconds to fully stop
  }
  echo "Stopped unraid-api: $output";

  if (!empty($msini['remote']['username'])) {
    $var = parse_ini_file("/var/local/emhttp/var.ini");
    $keyfile = @file_get_contents($var['regFILE']);
    if ($keyfile !== false) {
      echo "\nSigning out of Unraid Connect\n";
      $ch = curl_init('https://keys.lime-technology.com/account/server/unregister');
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($ch, CURLOPT_POST, 1);
      curl_setopt($ch, CURLOPT_POSTFIELDS, ['keyfile' => @base64_encode($keyfile)]);
      curl_exec($ch);
      curl_close($ch);
    }
  }

  # remove myservers.cfg
  unlink('/boot/config/plugins/dynamix.my.servers/myservers.cfg');

  # reload nginx to disable Remote Access
  echo "\n⚠️ Reloading Web Server. If this window stops updating for two minutes please close it.\n";
  exec("/etc/rc.d/rc.nginx reload &>/dev/null");
}

exit(0); 