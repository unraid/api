<?php
$docroot = $docroot ?? $_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp';

class WebComponentsExtractor {
    private const MANIFEST_FILE = '/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components/manifest.json';
    private const SEARCH_TEXT = 'unraid-components.client.mjs';
    private const PREFIXED_PATH = '/plugins/dynamix.my.servers/unraid-components/';

    private string $jsFileName = '';

    public function __construct() {
        $localManifest = json_decode(file_get_contents(self::MANIFEST_FILE), true);

        foreach ($localManifest as $key => $value) {
            if (strpos($key, self::SEARCH_TEXT) !== false && isset($value["file"])) {
                $this->jsFileName = $value["file"];
                break;
            }
        }
    }

    public function getJsFileName(): string {
        return $this->jsFileName;
    }

    public function getJSFileRelativePath(): string {
        return self::PREFIXED_PATH . $this->jsFileName;
    }

    public function getScriptTagHtml(): string {
        if (empty($this->jsFileName)) {
            return '<script>console.error("%cNo matching key containing \'' . self::SEARCH_TEXT . '\' found.", "font-weight: bold; color: white; background-color: red");</script>';
        }
        return '<script src="' . $this->getJSFileRelativePath() . '"></script>';
    }
}
