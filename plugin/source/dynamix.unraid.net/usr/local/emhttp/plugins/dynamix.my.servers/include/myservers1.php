<style>
#header {
  z-index: 102 !important;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -ms-flex-pack: justify;
  justify-content: space-between;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
}
connect-user-profile {
  font-size: 16px;
  margin-left: auto;
  height: 100%;
}
</style>
<?php
// Set the path for the local manifest file
$localManifestFile = '/usr/local/emhttp/plugins/dynamix.my.servers/connect-components/manifest.json';

// Define the remote resource URL
$remoteResourceUrl = 'https://components.myunraid.com/';

// Check if session cookie exists
if (!isset($_COOKIE['manifest_last_checked']) || time() - $_COOKIE['manifest_last_checked'] >= 300) {
  // Get the remote manifest JSON
  $remoteManifestJson = file_get_contents($remoteResourceUrl . 'manifest.json');

  // Compare the remote and local manifest versions
  $remoteManifest = json_decode($remoteManifestJson, true);
  $localManifest = json_decode(file_get_contents($localManifestFile), true);

  if ($remoteManifest && $localManifest && $remoteManifest !== $localManifest) {
    // Update the local manifest
    file_put_contents($localManifestFile, $remoteManifestJson);

    // Download the file contents for the search value
    $searchText = 'connect-components.client.mjs';
    $fileValue = null;

    foreach ($remoteManifest as $key => $value) {
      if (strpos($key, $searchText) !== false && isset($value["file"])) {
        $fileValue = file_get_contents($remoteResourceUrl . $value["file"]);
        break;
      }
    }

    if ($fileValue !== null) {
      // Extract the directory path from the URL
      $directoryPath = pathinfo($value["file"], PATHINFO_DIRNAME);
      // Set the local file path
      $localFilePath = '/usr/local/emhttp/plugins/dynamix.my.servers' . $directoryPath;
      // Create the directory if it doesn't exist
      if (!is_dir($localFilePath)) {
        mkdir($localFilePath, 0777, true);
      }
      // Save the file contents to a local file
      file_put_contents($localFilePath . '/' . basename($value["file"]), $fileValue);
    }
  }

  // Set the session cookie with the current timestamp
  setcookie('manifest_last_checked', time(), time() + 300); // Expire in 5 minutes
}

// Load the local manifest
$localManifest = json_decode(file_get_contents($localManifestFile), true);

$searchText = 'connect-components.client.mjs';
$fileValue = null;

foreach ($localManifest as $key => $value) {
  if (strpos($key, $searchText) !== false && isset($value["file"])) {
    $fileValue = $value["file"];
    break;
  }
}

if ($fileValue !== null) {
  $prefixedPath = '/plugins/dynamix.my.servers/connect-components/';
  echo '<script src="' . $prefixedPath . $fileValue . '"></script>';
} else {
  echo '<script>console.error("%cNo matching key containing \'' . $searchText . '\' found.", "font-weight: bold; color: white; background-color: red");</script>';
}
?>
