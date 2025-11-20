<?php
$docroot = $docroot ?? $_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp';

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

    private function getThemeInitScript(): string
    {
        $cookieName = 'unraid.theme.cssVars';
        
        // Try filter_input first (PHP 8 best practice)
        $cookieValue = filter_input(INPUT_COOKIE, $cookieName, FILTER_UNSAFE_RAW);
        
        // Fallback to $_COOKIE if filter_input returns null (more reliable for URL-encoded values)
        if ($cookieValue === null || $cookieValue === false) {
            $cookieValue = $_COOKIE[$cookieName] ?? null;
        }
        
        if ($cookieValue === null || $cookieValue === '') {
            return '';
        }
        
        // PHP's $_COOKIE auto-decodes, but filter_input might return encoded value
        // Decode if it still contains URL-encoded characters
        $decoded = $cookieValue;
        if (str_contains($cookieValue, '%')) {
            $decoded = urldecode($cookieValue);
            // If urldecode didn't change it, try rawurldecode (handles + differently)
            if ($decoded === $cookieValue) {
                $decoded = rawurldecode($cookieValue);
            }
        }
        
        // Parse JSON with proper error handling
        $cssVars = json_decode($decoded, true);
        
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($cssVars) || empty($cssVars)) {
            return '';
        }
        
        // Build CSS rules with proper escaping
        $cssRules = [];
        foreach ($cssVars as $key => $value) {
            if (!is_string($key) || !is_string($value) || $value === '') {
                continue;
            }
            
            $cssRules[] = sprintf(
                '  %s: %s;',
                htmlspecialchars($key, ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8')
            );
        }
        
        if (empty($cssRules)) {
            return '';
        }
        
        return '<style id="unraid-theme-css-vars">
:root {
' . implode("\n", $cssRules) . '
}
</style>';
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
