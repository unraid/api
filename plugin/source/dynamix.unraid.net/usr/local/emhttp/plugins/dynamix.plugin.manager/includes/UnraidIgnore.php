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
 * @param removeAll {boolean} - if true, will remove all versions from the JSON file
 * @param removeVersion {string} - the version of the OS release we want to remove
 * @param version {string} - the version of the OS release we want to ignore
 */
$json_file_key = 'updateOsIgnoredReleases';
$json_file = '/tmp/unraidcheck/ignored.json';

function isValidSemVerFormat($version) {
  return preg_match('/^\d+\.\d+(\.\d+)?(-.+)?$/',$version);
}

// Ensure that the request is a GET request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

  // Read the JSON data from the request body
  // $json_data = file_get_contents('php://input');
  $json_data = $_GET;

  if (empty($json_data)) {
    http_response_code(400); // Bad Request
    echo "No JSON data found";
    return;
  }

  $data = $json_data;

  if ($data !== null) {
    // Check if the "removeAll" key exists in the $data array
    if (isset($data['removeAll']) && $data['removeAll'] === true) {

      // Check if the JSON file exists
      if (file_exists($json_file)) {
        // Delete the JSON file
        unlink($json_file);
        // return empty array to represent no ignored versions
        header('Content-Type: application/json');
        echo json_encode([$json_file_key => []], JSON_PRETTY_PRINT);
      } else {
        http_response_code(400); // Bad Request
        echo "No JSON file found";
      }
    }
    // Check if the "removeVersion" key exists in the $data array
    else if (isset($data['removeVersion'])) {
      // Check if the "removeVersion" value is a valid PHP-standardized version number string
      $remove_version = $data['removeVersion'];
      if (isValidSemVerFormat($remove_version)) {
        // Check if the JSON file exists
        if (file_exists($json_file)) {
          // If the file exists, read its content
          $existing_data = json_decode(file_get_contents($json_file), true);

          // Check if key exists
          if (isset($existing_data[$json_file_key])) {
            // Remove the specified version from the array
            $existing_data[$json_file_key] = array_diff($existing_data[$json_file_key], [$remove_version]);

            // Save the updated data to the JSON file
            file_put_contents($json_file, json_encode($existing_data, JSON_PRETTY_PRINT));

            http_response_code(200); // OK
            header('Content-Type: application/json');
            echo json_encode($existing_data, JSON_PRETTY_PRINT);
          } else {
            http_response_code(400); // Bad Request
            echo "No versions to remove in the JSON file";
          }
        } else {
          http_response_code(400); // Bad Request
          echo "No JSON file found";
        }
      } else {
        http_response_code(400); // Bad Request
        echo "Invalid removeVersion format";
      }
    }
    // Check if the "version" key exists in the $data array
    else if (isset($data['version'])) {

      // Check if the "version" value is a valid PHP-standardized version number string
      $version = $data['version'];
      if (isValidSemVerFormat($version)) {
        // Prepare the new data structure
        $new_data = [$json_file_key => [$version]];

        // Check if the JSON file already exists
        if (file_exists($json_file)) {
          // If the file exists, read its content
          $existing_data = json_decode(file_get_contents($json_file), true);

          // Check if key already exists
          if (isset($existing_data[$json_file_key])) {
            // Append the new version to the existing array
            $existing_data[$json_file_key][] = $version;
          } else {
            // If key doesn't exist, create it
            $existing_data[$json_file_key] = [$version];
          }

          // Update the data to be saved
          $new_data = $existing_data;
        }

        // Save the data to the JSON file
        file_put_contents($json_file, json_encode($new_data, JSON_PRETTY_PRINT));

        http_response_code(200); // OK
        header('Content-Type: application/json');
        echo json_encode($new_data, JSON_PRETTY_PRINT);
      } else {
        http_response_code(400); // Bad Request
        echo "Invalid version format";
      }

    } else {
      http_response_code(400); // Bad Request
      echo "Invalid param data";
    }

  } else {
    http_response_code(400); // Bad Request
    echo "Error decoding JSON data";
  }

} else {
  // Handle non-GET requests
  http_response_code(405); // Method Not Allowed
  echo "Only GET requests are allowed";
}
