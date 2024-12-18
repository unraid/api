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

class ActivationCodeExtractor {
    public const DIR = '/boot/config/activation';
    public const FILE_PATTERN = '/activation_code_([A-Za-z0-9]+)\.activationcode/';

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

        if (!is_dir(self::DIR)) {
            return $data;
        }

        $files = scandir(self::DIR);

        if ($files === false || count($files) === 0) {
            return $data;
        }

        foreach ($files as $file) {
            $filePath = self::DIR . DIRECTORY_SEPARATOR . $file;

            if (preg_match(self::FILE_PATTERN, $file, $matches)) {
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
    public function getData($asJson = false, $asJsonForHtmlAttr = false): array {
        return $this->data;
    }

    /**
     * Retrieve the activation code data as JSON string with converted special characters to HTML entities
     *
     * @return string
     */
    public function getDataForHtmlAttr(): string {
        $json = json_encode($this->getData());
        return htmlspecialchars($json, ENT_QUOTES, 'UTF-8');
    }
}
