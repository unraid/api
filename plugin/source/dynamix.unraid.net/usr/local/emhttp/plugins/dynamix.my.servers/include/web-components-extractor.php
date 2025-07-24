<?php
$docroot = $docroot ?? $_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp';

class WebComponentsExtractor
{
    private const PREFIXED_PATH = '/plugins/dynamix.my.servers/unraid-components/';
    private const RICH_COMPONENTS_ENTRY = 'unraid-components.client.mjs';
    private const RICH_COMPONENTS_ENTRY_JS = 'unraid-components.client.js';
    private const UI_ENTRY = 'src/register.ts';
    private const UI_STYLES_ENTRY = 'style.css';

    private static ?WebComponentsExtractor $instance = null;

    private function __construct() {}

    public static function getInstance(): WebComponentsExtractor
    {
        if (self::$instance === null) {
            self::$instance = new WebComponentsExtractor();
        }
        return self::$instance;
    }

    private function findManifestFiles(string $manifestName): array
    {
        $basePath = '/usr/local/emhttp' . self::PREFIXED_PATH;
        $escapedBasePath = escapeshellarg($basePath);
        $escapedManifestName = escapeshellarg($manifestName);
        $command = "find {$escapedBasePath} -name {$escapedManifestName}";
        exec($command, $files);
        return $files;
    }

    public function getAssetPath(string $asset, string $subfolder = ''): string
    {
        return self::PREFIXED_PATH . ($subfolder ? $subfolder . '/' : '') . $asset;
    }

    private function getRelativePath(string $fullPath): string
    {
        $basePath = '/usr/local/emhttp' . self::PREFIXED_PATH;
        $relative = str_replace($basePath, '', $fullPath);
        return dirname($relative);
    }

    public function getManifestContents(string $manifestPath): array
    {
        $contents = @file_get_contents($manifestPath);
        return $contents ? json_decode($contents, true) : [];
    }


    private function getRichComponentsFile(): string
    {
        $manifestFiles = $this->findManifestFiles('manifest.json');
        
        foreach ($manifestFiles as $manifestPath) {
            $manifest = $this->getManifestContents($manifestPath);
            $subfolder = $this->getRelativePath($manifestPath);
            
            foreach ($manifest as $key => $value) {
                // Skip timestamp entries
                if ($key === 'ts' || !is_array($value)) {
                    continue;
                }
                
                // Check for both old format (direct key match) and new format (path-based key)
                $matchesMjs = strpos($key, self::RICH_COMPONENTS_ENTRY) !== false;
                $matchesJs = strpos($key, self::RICH_COMPONENTS_ENTRY_JS) !== false;
                
                if (($matchesMjs || $matchesJs) && isset($value["file"])) {
                    return ($subfolder ? $subfolder . '/' : '') . $value["file"];
                }
            }
        }
        return '';
    }

    private function getRichComponentsScript(): string
    {
        $jsFile = $this->getRichComponentsFile();
        if (empty($jsFile)) {
            return '<script>console.error("%cNo matching key containing \'' . self::RICH_COMPONENTS_ENTRY . '\' or \'' . self::RICH_COMPONENTS_ENTRY_JS . '\' found.", "font-weight: bold; color: white; background-color: red");</script>';
        }
        // Add a unique identifier to prevent duplicate script loading
        $scriptId = 'unraid-rich-components-script';
        return '<script id="' . $scriptId . '" src="' . $this->getAssetPath($jsFile) . '"></script>
        <script>
            // Remove duplicate script tags to prevent multiple loads
            (function() {
                var scripts = document.querySelectorAll(\'script[id="' . $scriptId . '"]\');
                if (scripts.length > 1) {
                    for (var i = 1; i < scripts.length; i++) {
                        scripts[i].remove();
                    }
                }
            })();
        </script>';
    }

    private function getUnraidUiScriptHtml(): string
    {
        $manifestFiles = $this->findManifestFiles('ui.manifest.json');
        
        if (empty($manifestFiles)) {
            error_log("No ui.manifest.json found");
            return '';
        }

        $manifestPath = $manifestFiles[0]; // Use the first found manifest
        $manifest = $this->getManifestContents($manifestPath);
        $subfolder = $this->getRelativePath($manifestPath);

        if (!isset($manifest[self::UI_ENTRY]) || !isset($manifest[self::UI_STYLES_ENTRY])) {
            error_log("Required entries not found in ui.manifest.json");
            return '';
        }

        $jsFile = ($subfolder ? $subfolder . '/' : '') . $manifest[self::UI_ENTRY]['file'];
        $cssFile = ($subfolder ? $subfolder . '/' : '') . $manifest[self::UI_STYLES_ENTRY]['file'];

        // Use a data attribute to ensure this only runs once per page
        return '<script data-unraid-ui-register defer type="module">
            (async function() {
                // Check if components have already been registered
                if (window.__unraidUiComponentsRegistered) {
                    return;
                }
                
                // Mark as registered immediately to prevent race conditions
                window.__unraidUiComponentsRegistered = true;
                
                try {
                    const { registerAllComponents } = await import("' . $this->getAssetPath($jsFile) . '");
                    registerAllComponents({ pathToSharedCss: "' . $this->getAssetPath($cssFile) . '" });
                } catch (error) {
                    console.error("[Unraid UI] Failed to register components:", error);
                    // Reset flag on error so it can be retried
                    window.__unraidUiComponentsRegistered = false;
                }
                
                // Clean up duplicate script tags
                const scripts = document.querySelectorAll(\'script[data-unraid-ui-register]\');
                if (scripts.length > 1) {
                    for (let i = 1; i < scripts.length; i++) {
                        scripts[i].remove();
                    }
                }
            })();
        </script>';
    }

    public function getScriptTagHtml(): string
    {
        // Use a static flag to ensure scripts are only output once per request
        static $scriptsOutput = false;
        
        if ($scriptsOutput) {
            return '<!-- Web components scripts already loaded -->';
        }
        
        try {
            $scriptsOutput = true;
            return $this->getRichComponentsScript() . $this->getUnraidUiScriptHtml();
        } catch (\Exception $e) {
            error_log("Error in WebComponentsExtractor::getScriptTagHtml: " . $e->getMessage());
            $scriptsOutput = false; // Reset on error
            return "";
        }
    }
}
