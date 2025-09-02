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
                    $scripts[] = '<script id="' . $safeId . '" type="module" src="' . $safePath . '"></script>';
                } elseif ($extension === 'css') {
                    // Generate link tag for CSS files with unique ID
                    $scripts[] = '<link id="' . $safeId . '" rel="stylesheet" href="' . $safePath . '">';
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
                var elements = document.querySelectorAll(\'[id^="unraid-"]\');
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

    public function getScriptTagHtml(): string
    {
        // Use a static flag to ensure scripts are only output once per request
        static $scriptsOutput = false;
        
        if ($scriptsOutput) {
            return '<!-- Resources already loaded -->';
        }
        
        try {
            $scriptsOutput = true;
            return $this->processManifestFiles();
        } catch (\Exception $e) {
            error_log("Error in WebComponentsExtractor::getScriptTagHtml: " . $e->getMessage());
            $scriptsOutput = false; // Reset on error
            return "";
        }
    }
}
