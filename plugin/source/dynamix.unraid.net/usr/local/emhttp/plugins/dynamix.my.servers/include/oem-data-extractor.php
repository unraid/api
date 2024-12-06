<?php
/* Copyright 2005-2023, Lime Technology
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */
$docroot = $docroot ?? $_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp';

class OemDataExtractor {
    public const OEM_DIR = '/boot/config/oem';
    public const OEM_FILE_PATTERN = '/activation_code_([A-Za-z0-9]+)\.activationcode/';

    private array $data = [];

    /**
     * Constructor to automatically fetch JSON data from all matching files.
     */
    public function __construct() {
        $this->data = $this->fetchJsonData();
    }

    /**
     * Fetch JSON data from all files matching the pattern.
     * 
     * @return array Array of extracted JSON data.
     */
    private function fetchJsonData(): array {
        $data = [];

        if (!is_dir(self::OEM_DIR)) {
            return $data;
        }

        $files = scandir(self::OEM_DIR);

        if ($files === false || count($files) === 0) {
            return $data;
        }

        foreach ($files as $file) {
            $filePath = self::OEM_DIR . DIRECTORY_SEPARATOR . $file;

            if (preg_match(self::OEM_FILE_PATTERN, $file, $matches)) {
                // $activationCode = $matches[1];
                $fileContent = file_get_contents($filePath);
                $jsonData = json_decode($fileContent, true);

                if (json_last_error() === JSON_ERROR_NONE) {
                    $data = $jsonData;
                } else {
                    $data = ['error' => 'Invalid JSON format'];
                }

                break; // Stop after the first match
            }
        }

        return $data;
    }

    /**
     * Get the extracted data.
     * 
     * @return array
     */
    public function getData(): array {
        return $this->data;
    }
}
