<?php
$docroot = $docroot ?? $_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp';
if (!class_exists('ThemeHelper')) {
    $themeHelperPath = $docroot . '/plugins/dynamix/include/ThemeHelper.php';
    if (is_readable($themeHelperPath)) {
        require_once $themeHelperPath;
    }
}

class WebComponentsExtractor
{
    private const PREFIXED_PATH = '/plugins/dynamix.my.servers/unraid-components/';

    private static ?WebComponentsExtractor $instance = null;

    private function __construct() {}

    public static function getInstance(): WebComponentsExtractor
    {
        if (self::$instance === null) {
            self::$instance = new WebComponentsExtractor();
        }
        return self::$instance;
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
    
    private function sanitizeForId(string $input): string
    {
        return preg_replace('/[^a-zA-Z0-9-]/', '-', $input);
    }

    public function getManifestContents(string $manifestPath): array
    {
        $contents = @file_get_contents($manifestPath);
        return $contents ? json_decode($contents, true) : [];
    }

    private function processManifestFiles(): string
    {
        // Find all manifest files (*.manifest.json or manifest.json)
        $manifestFiles = $this->findAllManifestFiles();
        
        if (empty($manifestFiles)) {
            return '';
        }
        
        $scripts = [];
        
        // Process each manifest file
        foreach ($manifestFiles as $manifestPath) {
            $manifest = $this->getManifestContents($manifestPath);
            if (empty($manifest)) {
                continue;
            }
            
            $subfolder = $this->getRelativePath($manifestPath);
            
            // Process each entry in the manifest
            foreach ($manifest as $key => $entry) {
                if ($key === 'ts') {
                    continue;
                }
                // Skip if not an array with a 'file' key
                if (!is_array($entry) || !isset($entry['file']) || empty($entry['file'])) {
                    continue;
                }
                
                // Build the file path
                $filePath = ($subfolder ? $subfolder . '/' : '') . $entry['file'];
                $fullPath = $this->getAssetPath($filePath);
                
                // Determine file type and generate appropriate tag
                $extension = pathinfo($entry['file'], PATHINFO_EXTENSION);
                
                // Sanitize subfolder and key for ID generation
                $sanitizedSubfolder = $subfolder ? $this->sanitizeForId($subfolder) . '-' : '';
                $sanitizedKey = $this->sanitizeForId($key);
                
                // Escape attributes for HTML safety
                $safeId = htmlspecialchars('unraid-' . $sanitizedSubfolder . $sanitizedKey, ENT_QUOTES, 'UTF-8');
                $safePath = htmlspecialchars($fullPath, ENT_QUOTES, 'UTF-8');
                
                if ($extension === 'js' || $extension === 'mjs') {
                    // Generate script tag with unique ID based on subfolder and key
                    $scripts[] = '<script id="' . $safeId . '" type="module" src="' . $safePath . '" data-unraid="1"></script>';
                    // Also emit any CSS referenced by this entry (Vite manifest "css": [])
                    if (!empty($entry['css']) && is_array($entry['css'])) {
                        foreach ($entry['css'] as $cssFile) {
                            if (!is_string($cssFile) || $cssFile === '') continue;
                            $cssPath = ($subfolder ? $subfolder . '/' : '') . $cssFile;
                            $cssFull = $this->getAssetPath($cssPath);
                            $cssId = htmlspecialchars(
                                'unraid-' . $sanitizedSubfolder . $sanitizedKey . '-css-' . $this->sanitizeForId(basename($cssFile)),
                                ENT_QUOTES,
                                'UTF-8'
                            );
                            $cssHref = htmlspecialchars($cssFull, ENT_QUOTES, 'UTF-8');
                            $scripts[] = '<link id="' . $cssId . '" rel="stylesheet" href="' . $cssHref . '" data-unraid="1">';
                        }
                    }
                } elseif ($extension === 'css') {
                    // Generate link tag for CSS files with unique ID
                    $scripts[] = '<link id="' . $safeId . '" rel="stylesheet" href="' . $safePath . '" data-unraid="1">';
                }
            }
        }
        
        if (empty($scripts)) {
            return '';
        }
        
        // Add deduplication script
        $deduplicationScript = '
        <script>
            // Remove duplicate resource tags to prevent multiple loads
            (function() {
                var elements = document.querySelectorAll(\'[data-unraid="1"]\');
                var seen = {};
                for (var i = 0; i < elements.length; i++) {
                    var el = elements[i];
                    if (seen[el.id]) {
                        el.remove();
                    } else {
                        seen[el.id] = true;
                    }
                }
            })();
        </script>';
        
        return implode("\n", $scripts) . $deduplicationScript;
    }
    
    private function findAllManifestFiles(): array
    {
        $basePath = '/usr/local/emhttp' . self::PREFIXED_PATH;
        $escapedBasePath = escapeshellarg($basePath);
        
        // Find all files ending with .manifest.json or exactly named manifest.json
        $command = "find {$escapedBasePath} -type f \\( -name '*.manifest.json' -o -name 'manifest.json' \\) 2>/dev/null";
        exec($command, $files);
        
        return $files;
    }

    private function normalizeHex(?string $color): ?string
    {
        if (!is_string($color) || trim($color) === '') {
            return null;
        }
        $color = trim($color);
        if ($color[0] !== '#') {
            $color = '#' . ltrim($color, '#');
        }
        $hex = substr($color, 1);
        if (strlen($hex) === 3) {
            $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
        }
        if (!ctype_xdigit($hex) || strlen($hex) !== 6) {
            return null;
        }
        return '#' . strtolower($hex);
    }

    private function hexToRgba(string $hex, float $alpha): string
    {
        $hex = ltrim($hex, '#');
        if (strlen($hex) === 3) {
            $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
        }
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        return sprintf('rgba(%d, %d, %d, %.3f)', $r, $g, $b, max(0, min(1, $alpha)));
    }

    /**
     * Attempt to build CSS variables from PHP display data (server-rendered settings).
     *
     * @return array{vars: array<string,string>, classes: string[], diagnostics: array}|null
     */
    private function getDisplayThemeVars(): ?array
    {
        if (!isset($GLOBALS['display']) || !is_array($GLOBALS['display'])) {
            return null;
        }
        $display = $GLOBALS['display'];
        $vars = [];

        $textPrimary = $this->normalizeHex($display['header'] ?? null);
        if ($textPrimary) {
            $vars['--header-text-primary'] = $textPrimary;
        }

        $textSecondary = $this->normalizeHex($display['headermetacolor'] ?? null);
        if ($textSecondary) {
            $vars['--header-text-secondary'] = $textSecondary;
        }

        $bgColor = $this->normalizeHex($display['background'] ?? null);
        if ($bgColor) {
            $vars['--header-background-color'] = $bgColor;
            $vars['--header-gradient-start'] = $this->hexToRgba($bgColor, 0);
            $vars['--header-gradient-end'] = $this->hexToRgba($bgColor, 0.7);
        }

        $shouldShowBannerGradient = ($display['showBannerGradient'] ?? '') === 'yes';
        if ($shouldShowBannerGradient) {
            $start = $vars['--header-gradient-start'] ?? 'rgba(0, 0, 0, 0)';
            $end = $vars['--header-gradient-end'] ?? 'rgba(0, 0, 0, 0.7)';
            $vars['--banner-gradient'] = sprintf(
                'linear-gradient(90deg, %s 0, %s 90%%)',
                $start,
                $end
            );
        }

        if (empty($vars)) {
            return null;
        }

        return [
            'vars' => $vars,
            'diagnostics' => [
                'theme' => $display['theme'] ?? null,
            ],
        ];
    }

    private function renderThemeVars(array $cssVars, string $source, array $diagnostics = []): string
    {
        $cssRules = [];
        foreach ($cssVars as $key => $value) {
            if (!is_string($key) || !is_string($value) || $value === '') {
                continue;
            }

            $safeKey = htmlspecialchars($key, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $safeValue = str_replace('</style>', '<\/style>', $value);

            $cssRules[] = sprintf(
                '  %s: %s;',
                $safeKey,
                $safeValue
            );
        }

        if (empty($cssRules)) {
            return '';
        }

        $diagnosticsPayload = array_merge(
            [
                'source' => $source,
                'count' => count($cssRules),
            ],
            $diagnostics
        );
        $diagMessage = sprintf('[MyServers] Theme vars applied: %s', json_encode($diagnosticsPayload));
        $encodedDiag = json_encode($diagMessage, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP);
        $encodedError = json_encode('[MyServers] Theme var hydration failed', JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP);

        $logScript = sprintf(
            '<script>(function(){try{console.info(%s);}catch(err){console.error(%s,err);}})();</script>',
            $encodedDiag,
            $encodedError
        );

        return '<style id="unraid-theme-css-vars">
:root {
' . implode("\n", $cssRules) . '
}
</style>' . $logScript;
    }

    private function getThemeInitScript(): string
    {
        $displayTheme = $this->getDisplayThemeVars();
        if ($displayTheme) {
            return $this->renderThemeVars(
                $displayTheme['vars'],
                'display',
                $displayTheme['diagnostics'] ?? []
            );
        }

        return '';
    }

    private static bool $scriptsOutput = false;

    public function getScriptTagHtml(): string
    {
        if (self::$scriptsOutput) {
            return '<!-- Resources already loaded -->';
        }
        
        try {
            self::$scriptsOutput = true;
            $themeScript = $this->getThemeInitScript();
            $manifestScripts = $this->processManifestFiles();
            return $themeScript . "\n" . $manifestScripts;
        } catch (\Exception $e) {
            error_log("Error in WebComponentsExtractor::getScriptTagHtml: " . $e->getMessage());
            self::$scriptsOutput = false; // Reset on error
            return "";
        }
    }

    public static function resetScriptsOutput(): void
    {
        self::$scriptsOutput = false;
    }
}
