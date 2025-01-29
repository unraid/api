<?php
$docroot = $docroot ?? $_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp';

class WebComponentsExtractor
{
    private const PREFIXED_PATH = '/plugins/dynamix.my.servers/unraid-components/';
    private const RICH_COMPONENTS_ENTRY = 'unraid-components.client.mjs';
    private const UI_ENTRY = 'src/register.ts';
    private const UI_STYLES_ENTRY = 'style.css';

    public function __construct() {}

    public function getAssetPath(string $asset): string
    {
        return self::PREFIXED_PATH . $asset;
    }

    public function getManifestContents(string $pathFromComponents): array
    {
        $filePath = '/usr/local/emhttp' . $this->getAssetPath($pathFromComponents);
        return json_decode(file_get_contents($filePath), true);
    }

    private function getRichComponentsFile(): string
    {
        $localManifest = $this->getManifestContents('manifest.json');

        foreach ($localManifest as $key => $value) {
            if (strpos($key, self::RICH_COMPONENTS_ENTRY) !== false && isset($value["file"])) {
                return $value["file"];
            }
        }
    }

    private function getRichComponentsScript(): string
    {
        $jsFile = $this->getRichComponentsFile();
        if (empty($jsFile)) {
            return '<script>console.error("%cNo matching key containing \'' . self::RICH_COMPONENTS_ENTRY . '\' found.", "font-weight: bold; color: white; background-color: red");</script>';
        }
        return '<script src="' . $this->getAssetPath($jsFile) . '"></script>';
    }

    private function getUnraidUiScriptHtml(): string
    {
        $manifest = $this->getManifestContents('ui.manifest.json');
        $jsFile = $manifest[self::UI_ENTRY]['file'];
        $cssFile = $manifest[self::UI_STYLES_ENTRY]['file'];
        return '<script defer type="module">
            import { registerAllComponents } from "' . $this->getAssetPath($jsFile) . '";
            registerAllComponents({ pathToSharedCss: "' . $this->getAssetPath($cssFile) . '" });
        </script>';
    }

    public function getScriptTagHtml(): string
    {
        return $this->getRichComponentsScript() . $this->getUnraidUiScriptHtml();
    }
}
