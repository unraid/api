#!/usr/bin/env php
<?php
/**
 * WebComponentsExtractor Test Suite
 * 
 * Exit codes:
 *   0 - All tests passed
 *   1 - One or more tests failed
 */

class ExtractorTest {
    private $testDir;
    private $componentDir;
    private $passed = 0;
    private $failed = 0;
    private $verbose = false;
    private $standaloneJsFile = 'standalone-apps-AbCdEf12.js';
    private $standaloneCssFile = 'standalone-apps-ZyXwVuTs.css';
    
    // Color codes for terminal output
    const RED = "\033[0;31m";
    const GREEN = "\033[0;32m";
    const YELLOW = "\033[1;33m";
    const NC = "\033[0m"; // No Color
    
    public function __construct() {
        $this->verbose = getenv('VERBOSE') === '1' || in_array('--verbose', $_SERVER['argv'] ?? []);
    }
    
    public function run() {
        $this->setup();
        $this->runTests();
        $this->teardown();
        return $this->reportResults();
    }
    
    private function setup() {
        echo "Setting up test environment...\n";
        
        // Create temp directory
        $this->testDir = sys_get_temp_dir() . '/extractor_test_' . uniqid();
        $this->componentDir = $this->testDir . '/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components';
        
        // Create directory structure
        @mkdir($this->componentDir . '/standalone-apps', 0777, true);
        @mkdir($this->componentDir . '/ui-components', 0777, true);
        @mkdir($this->componentDir . '/other', 0777, true);
        
        // Create test manifest files
        file_put_contents($this->componentDir . '/standalone-apps/standalone.manifest.json', json_encode([
            $this->standaloneCssFile => [
                'file' => $this->standaloneCssFile,
                'src' => $this->standaloneCssFile
            ],
            $this->standaloneJsFile => [
                'file' => $this->standaloneJsFile,
                'src' => $this->standaloneJsFile,
                'css' => ['app-styles.css', 'theme.css']
            ],
            'ts' => 1234567890
        ], JSON_PRETTY_PRINT));
        
        file_put_contents($this->componentDir . '/ui-components/ui.manifest.json', json_encode([
            'ui-styles' => [
                'file' => 'ui-components.css'
            ],
            'ui-script' => [
                'file' => 'components.mjs'
            ],
            'invalid-entry' => [
                'notAFile' => 'should be skipped'
            ],
            'empty-file' => [
                'file' => ''
            ]
        ], JSON_PRETTY_PRINT));
        
        file_put_contents($this->componentDir . '/other/manifest.json', json_encode([
            'app-entry' => [
                'file' => 'app.js',
                'css' => ['main.css']
            ],
            'app-styles' => [
                'file' => 'app.css'
            ]
        ], JSON_PRETTY_PRINT));
        
        // Create duplicate key in different subfolder to test collision prevention
        file_put_contents($this->componentDir . '/standalone-apps/collision.manifest.json', json_encode([
            'app-entry' => [
                'file' => 'collision-app.js'
            ]
        ], JSON_PRETTY_PRINT));
        
        // Create manifest with special characters for HTML escaping test
        file_put_contents($this->componentDir . '/ui-components/special.manifest.json', json_encode([
            'test"with>quotes' => [
                'file' => 'test-file.js'
            ],
            'test&with<special' => [
                'file' => 'special\'file".css'
            ]
        ], JSON_PRETTY_PRINT));

        // Create an invalid JSON manifest to ensure it is safely ignored
        file_put_contents($this->componentDir . '/other/invalid.manifest.json', '{ invalid json ');
        // Create an empty manifest file
        file_put_contents($this->componentDir . '/other/empty.manifest.json', '');

        // Create a manifest with unsupported file types to ensure they are ignored
        file_put_contents($this->componentDir . '/other/unsupported.manifest.json', json_encode([
            'image-entry' => [
                'file' => 'logo.svg'
            ],
            'font-entry' => [
                'file' => 'font.woff2'
            ]
        ], JSON_PRETTY_PRINT));

        // Create a manifest with invalid CSS list entries (only strings should be emitted)
        file_put_contents($this->componentDir . '/other/css-list-invalid.manifest.json', json_encode([
            'css-list-test' => [
                'file' => 'css-list-test.js',
                'css' => ['ok.css', '', null, 0, false]
            ]
        ], JSON_PRETTY_PRINT));
        
        // Copy and modify the extractor for testing
        $this->prepareExtractor();
    }
    
    private function prepareExtractor() {
        $extractorPath = dirname(__DIR__) . '/source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers/include/web-components-extractor.php';
        $extractorContent = file_get_contents($extractorPath);
        
        // Modify paths for test environment
        $extractorContent = str_replace(
            "'/usr/local/emhttp' . self::PREFIXED_PATH",
            "'" . $this->testDir . "/usr/local/emhttp' . self::PREFIXED_PATH",
            $extractorContent
        );
        
        file_put_contents($this->testDir . '/extractor.php', $extractorContent);
    }
    
    private function getExtractorOutput($resetStatic = false) {
        $_SERVER['DOCUMENT_ROOT'] = '/usr/local/emhttp';
        require_once $this->testDir . '/extractor.php';
        
        if ($resetStatic) {
            $this->resetExtractor();
        }
        
        $extractor = WebComponentsExtractor::getInstance();
        return $extractor->getScriptTagHtml();
    }

    private function getExtractorOutputWithDisplay(?array $display): string
    {
        if ($display === null) {
            unset($GLOBALS['display']);
        } else {
            $GLOBALS['display'] = $display;
        }
        return $this->getExtractorOutput(true);
    }

    private function runTests() {
        echo "\n";
        echo "========================================\n";
        echo "   WebComponentsExtractor Test Suite\n";
        echo "========================================\n";
        echo "\n";
        
        $output = $this->getExtractorOutput();
        
        if ($this->verbose) {
            echo self::YELLOW . "Generated output:" . self::NC . "\n";
            echo $output . "\n\n";
        }
        
        // Test: Script Tag Generation
        echo "Test: Script Tag Generation\n";
        echo "----------------------------\n";
        $this->test(
            "Generates script tag for hashed standalone JS",
            strpos($output, 'script id="unraid-standalone-apps-' . $this->sanitizeForExpectedId($this->standaloneJsFile) . '"') !== false
        );
        $this->test(
            "Generates script tag for components.mjs",
            strpos($output, 'script id="unraid-ui-components-ui-script"') !== false
        );
        $this->test(
            "Generates script tag for app.js",
            strpos($output, 'script id="unraid-other-app-entry"') !== false
        );
        
        // Test: CSS Link Generation
        echo "\nTest: CSS Link Generation\n";
        echo "--------------------------\n";
        $this->test(
            "Generates link tag for hashed standalone CSS",
            strpos($output, 'link id="unraid-standalone-apps-' . $this->sanitizeForExpectedId($this->standaloneCssFile) . '"') !== false
        );
        $this->test(
            "Generates link tag for UI styles",
            strpos($output, 'link id="unraid-ui-components-ui-styles"') !== false
        );
        $this->test(
            "Generates link tag for app styles",
            strpos($output, 'link id="unraid-other-app-styles"') !== false
        );
        
        // Test: Invalid Entries Handling
        echo "\nTest: Invalid Entries Handling\n";
        echo "-------------------------------\n";
        $this->test(
            "Skips entries without 'file' key",
            strpos($output, 'notAFile') === false
        );
        $this->test(
            "Skips invalid entry content",
            strpos($output, 'should be skipped') === false
        );
        $this->test(
            "Skips entries with empty file value",
            strpos($output, 'empty-file') === false && strpos($output, 'id="unraid-ui-components-empty-file"') === false
        );
        
        // Test: Deduplication Script
        echo "\nTest: Deduplication Script\n";
        echo "---------------------------\n";
        $this->test(
            "Includes deduplication script",
            strpos($output, 'Remove duplicate resource tags') !== false
        );
        $this->test(
            "Deduplication targets correct elements",
            strpos($output, 'document.querySelectorAll') !== false
        );
        $this->test(
            "Deduplication only targets data-unraid elements",
            strpos($output, 'querySelectorAll(\'[data-unraid="1"]\')') !== false
        );
        
        // Test: Path Construction
        echo "\nTest: Path Construction\n";
        echo "------------------------\n";
        $this->test(
            "Correctly constructs standalone-apps path",
            strpos($output, '/plugins/dynamix.my.servers/unraid-components/standalone-apps/' . $this->standaloneJsFile) !== false
        );
        $this->test(
            "Correctly constructs ui-components path",
            strpos($output, '/plugins/dynamix.my.servers/unraid-components/ui-components/components.mjs') !== false
        );
        $this->test(
            "Correctly constructs generic manifest path",
            strpos($output, '/plugins/dynamix.my.servers/unraid-components/other/app.js') !== false
        );
        
        // Test: ID Collision Prevention
        echo "\nTest: ID Collision Prevention\n";
        echo "------------------------------\n";
        $this->test(
            "Different IDs for same key in different subfolders (standalone-apps)",
            strpos($output, 'id="unraid-standalone-apps-app-entry"') !== false
        );
        $this->test(
            "Different IDs for same key in different subfolders (other)",
            strpos($output, 'id="unraid-other-app-entry"') !== false
        );
        $appEntryCount = substr_count($output, 'id="unraid-') - substr_count($output, 'id="unraid-ui-');
        $this->test(
            "Both app-entry scripts are present with unique IDs",
            preg_match_all('/id="unraid-[^"]*app-entry"/', $output, $matches) === 2
        );
        
        // Test: HTML Attribute Escaping
        echo "\nTest: HTML Attribute Escaping\n";
        echo "------------------------------\n";
        $this->test(
            "Properly escapes quotes in ID attributes",
            strpos($output, '"test"with>quotes"') === false
        );
        $this->test(
            "Properly escapes special characters in ID",
            strpos($output, 'unraid-ui-components-test-with-quotes') !== false || 
            strpos($output, 'unraid-ui-components-test-with-special') !== false
        );
        $this->test(
            "Properly escapes special characters in src/href attributes",
            strpos($output, "special'file\"") === false && 
            (strpos($output, 'special&#039;file&quot;') !== false || 
             strpos($output, "special&apos;file&quot;") !== false ||
             strpos($output, "special'file&quot;") === false)
        );
        
        // Test: Data-Unraid Attribute
        echo "\nTest: Data-Unraid Attribute\n";
        echo "----------------------------\n";
        $this->test(
            "Script tags have data-unraid attribute",
            preg_match('/<script[^>]+data-unraid="1"/', $output) > 0
        );
        $this->test(
            "Link tags have data-unraid attribute",
            preg_match('/<link[^>]+data-unraid="1"/', $output) > 0
        );
        
        // Test: CSS Loading from Manifest
        echo "\nTest: CSS Loading from Manifest\n";
        echo "--------------------------------\n";
        $this->test(
            "Loads CSS from JS entry css array (app-styles.css)",
            strpos($output, 'id="unraid-standalone-apps-' . $this->sanitizeForExpectedId($this->standaloneJsFile) . '-css-app-styles-css"') !== false
        );
        $this->test(
            "Loads CSS from JS entry css array (theme.css)",
            strpos($output, 'id="unraid-standalone-apps-' . $this->sanitizeForExpectedId($this->standaloneJsFile) . '-css-theme-css"') !== false
        );
        $this->test(
            "CSS from manifest has correct href path (app-styles.css)",
            strpos($output, '/plugins/dynamix.my.servers/unraid-components/standalone-apps/app-styles.css') !== false
        );
        $this->test(
            "CSS from manifest has correct href path (theme.css)",
            strpos($output, '/plugins/dynamix.my.servers/unraid-components/standalone-apps/theme.css') !== false
        );
        $this->test(
            "Loads CSS from other JS entry (main.css)",
            strpos($output, 'id="unraid-other-app-entry-css-main-css"') !== false
        );
        $this->test(
            "CSS from manifest has data-unraid attribute",
            preg_match('/<link[^>]+id="unraid-[^"]*-css-[^"]+"[^>]+data-unraid="1"/', $output) > 0
        );
        $this->test(
            "Ignores non-string/empty entries in css array",
            preg_match_all('/id="unraid-other-css-list-test-css-[^"]+"/', $output, $matches) === 1 &&
            isset($matches[0][0]) &&
            strpos($matches[0][0], 'id="unraid-other-css-list-test-css-ok-css"') !== false
        );

        // Test: Manifest Format Robustness
        echo "\nTest: Manifest Format Robustness\n";
        echo "---------------------------------\n";
        $this->testManifestContentsRobustness();
        $this->test(
            "Does not generate tags for unsupported file extensions",
            strpos($output, 'logo.svg') === false &&
            strpos($output, 'font.woff2') === false
        );
        
        // Test: CSS Variable Validation
        echo "\nTest: CSS Variable Validation\n";
        echo "------------------------------\n";
        $this->testCssVariableValidation();

        // Test: Display Variations / Theme CSS Vars
        echo "\nTest: Display Variations\n";
        echo "-------------------------\n";
        $this->testDisplayVariations();
        
        // Test: Duplicate Prevention
        echo "\nTest: Duplicate Prevention\n";
        echo "---------------------------\n";
        // Reset singleton for duplicate test
        $reflection = new ReflectionClass('WebComponentsExtractor');
        $instance = $reflection->getProperty('instance');
        $instance->setAccessible(true);
        $instance->setValue(null, null);
        
        $extractor = WebComponentsExtractor::getInstance();
        $first = $extractor->getScriptTagHtml();
        $second = $extractor->getScriptTagHtml();
        $this->test(
            "Second call returns 'already loaded' message",
            strpos($second, 'Resources already loaded') !== false
        );
    }
    
    private function testCssVariableValidation() {
        $_SERVER['DOCUMENT_ROOT'] = '/usr/local/emhttp';
        require_once $this->testDir . '/extractor.php';
        
        $extractor = WebComponentsExtractor::getInstance();
        $reflection = new ReflectionClass('WebComponentsExtractor');
        $method = $reflection->getMethod('renderThemeVars');
        $method->setAccessible(true);
        
        // Test valid CSS variable names
        $validVars = [
            '--header-text-primary' => '#ffffff',
            '--header-text-secondary' => '#cccccc',
            '--header-background-color' => '#000000',
            '--test-var' => 'value',
            '--test_var' => 'value',
            '--test123' => 'value',
            '--A-Z_a-z0-9' => 'value',
        ];
        $output = $method->invoke($extractor, $validVars, 'test');
        $this->test(
            "Accepts valid CSS variable names starting with --",
            strpos($output, '--header-text-primary') !== false &&
            strpos($output, '--test-var') !== false &&
            strpos($output, '--test_var') !== false &&
            strpos($output, '--test123') !== false
        );
        
        // Test invalid CSS variable names (should be rejected)
        $invalidVars = [
            'not-a-var' => 'value',
            '-not-a-var' => 'value',
            '--var with spaces' => 'value',
            '--var<script>' => 'value',
            '--var"quote' => 'value',
            '--var\'quote' => 'value',
            '--var;injection' => 'value',
            '--var:colon' => 'value',
            '--var.value' => 'value',
            '--var/value' => 'value',
            '--var\\backslash' => 'value',
            '' => 'value',
            '--' => 'value',
        ];
        $output = $method->invoke($extractor, $invalidVars, 'test');
        $this->test(
            "Rejects CSS variable names without -- prefix",
            strpos($output, 'not-a-var') === false &&
            strpos($output, '-not-a-var') === false
        );
        $this->test(
            "Rejects CSS variable names with spaces",
            strpos($output, 'var with spaces') === false
        );
        $this->test(
            "Rejects CSS variable names with script tags",
            strpos($output, '<script>') === false &&
            strpos($output, 'var<script>') === false
        );
        $this->test(
            "Rejects CSS variable names with quotes",
            strpos($output, 'var"quote') === false &&
            strpos($output, "var'quote") === false
        );
        $this->test(
            "Rejects CSS variable names with semicolons",
            strpos($output, 'var;injection') === false
        );
        $this->test(
            "Rejects CSS variable names with dots",
            strpos($output, 'var.value') === false
        );
        $this->test(
            "Rejects empty or minimal invalid keys",
            strpos($output, ': --;') === false
        );
        
        // Test mixed valid and invalid (only valid should appear)
        $mixedVars = [
            '--valid-var' => 'value1',
            'invalid-var' => 'value2',
            '--another-valid' => 'value3',
            '--invalid<script>' => 'value4',
        ];
        $output = $method->invoke($extractor, $mixedVars, 'test');
        $this->test(
            "Accepts valid variables and rejects invalid ones in mixed input",
            strpos($output, '--valid-var') !== false &&
            strpos($output, '--another-valid') !== false &&
            strpos($output, 'invalid-var') === false &&
            strpos($output, '<script>') === false
        );
        
        // Test non-string keys (should be rejected)
        $nonStringKeys = [
            '--valid' => 'value',
            123 => 'value',
            true => 'value',
            null => 'value',
        ];
        $output = $method->invoke($extractor, $nonStringKeys, 'test');
        $this->test(
            "Rejects non-string keys",
            strpos($output, '--valid') !== false &&
            strpos($output, '123') === false
        );
    }

    private function testDisplayVariations(): void
    {
        // No $display => no theme CSS vars injected
        $output = $this->getExtractorOutputWithDisplay(null);
        $this->test(
            "No display data produces no theme CSS var style tag",
            strpos($output, 'id="unraid-theme-css-vars"') === false
        );

        // Banner empty + gradient yes => gradient should be ignored (no banner image)
        $output = $this->getExtractorOutputWithDisplay([
            'theme' => 'azure',
            'banner' => '',
            'showBannerGradient' => 'yes',
            'background' => '112233',
        ]);
        $this->test(
            "Banner disabled suppresses --banner-gradient",
            strpos($output, '--banner-gradient:') === false
        );
        $this->test(
            "Banner disabled suppresses header gradient start/end",
            strpos($output, '--header-gradient-start:') === false &&
            strpos($output, '--header-gradient-end:') === false
        );

        // Banner enabled + gradient yes + valid background => gradient vars and banner gradient
        $output = $this->getExtractorOutputWithDisplay([
            'theme' => 'azure',
            'banner' => 'image',
            'showBannerGradient' => 'yes',
            'background' => '112233',
        ]);
        $this->test(
            "Injects theme vars style tag",
            strpos($output, 'id="unraid-theme-css-vars"') !== false &&
            strpos($output, ':root {') !== false
        );
        $this->test(
            "Sets --theme-name from display theme",
            strpos($output, '--theme-name: azure;') !== false
        );
        $this->test(
            "Sets --theme-dark-mode for non-dark themes",
            strpos($output, '--theme-dark-mode: 0;') !== false
        );
        $this->test(
            "Normalizes and sets background color",
            strpos($output, '--header-background-color: #112233;') !== false
        );
        $this->test(
            "Derives header gradient start/end from background",
            strpos($output, '--header-gradient-start: rgba(17, 34, 51, 0.000);') !== false &&
            strpos($output, '--header-gradient-end: rgba(17, 34, 51, 0.700);') !== false
        );
        $this->test(
            "Emits --banner-gradient with banner stop variable",
            strpos($output, '--banner-gradient: linear-gradient(90deg,') !== false &&
            strpos($output, 'var(--banner-gradient-stop, 30%)') !== false
        );

        // Banner enabled + gradient no => no --banner-gradient, but does set start/end for other CSS usage
        $output = $this->getExtractorOutputWithDisplay([
            'theme' => 'azure',
            'banner' => 'image',
            'showBannerGradient' => 'no',
            'background' => '112233',
        ]);
        $this->test(
            "Gradient disabled suppresses --banner-gradient",
            strpos($output, '--banner-gradient:') === false
        );
        $this->test(
            "Banner enabled still emits header gradient start/end",
            strpos($output, '--header-gradient-start:') !== false &&
            strpos($output, '--header-gradient-end:') !== false
        );

        // Dark themes set --theme-dark-mode = 1
        $output = $this->getExtractorOutputWithDisplay([
            'theme' => 'black',
            'banner' => 'image',
            'showBannerGradient' => 'yes',
            'background' => '112233',
        ]);
        $this->test(
            "Dark theme sets --theme-dark-mode to 1",
            strpos($output, '--theme-dark-mode: 1;') !== false &&
            strpos($output, '--theme-name: black;') !== false
        );

        // Hex normalization: 3-digit values expand and lower-case
        $output = $this->getExtractorOutputWithDisplay([
            'theme' => 'azure',
            'banner' => 'image',
            'showBannerGradient' => 'yes',
            'background' => 'aBc',
            'header' => 'FfF',
            'headermetacolor' => '#0F0',
        ]);
        $this->test(
            "Normalizes 3-digit hex values",
            strpos($output, '--header-background-color: #aabbcc;') !== false &&
            strpos($output, '--header-text-primary: #ffffff;') !== false &&
            strpos($output, '--header-text-secondary: #00ff00;') !== false
        );

        // Invalid background => should not emit background var
        $output = $this->getExtractorOutputWithDisplay([
            'theme' => 'azure',
            'banner' => 'image',
            'showBannerGradient' => 'yes',
            'background' => 'not-a-hex',
        ]);
        $this->test(
            "Rejects invalid background color",
            strpos($output, '--header-background-color:') === false
        );
    }

    private function testManifestContentsRobustness(): void
    {
        $_SERVER['DOCUMENT_ROOT'] = '/usr/local/emhttp';
        require_once $this->testDir . '/extractor.php';

        $extractor = WebComponentsExtractor::getInstance();

        $missing = $extractor->getManifestContents($this->componentDir . '/other/does-not-exist.manifest.json');
        $this->test(
            "Missing manifest returns an empty array",
            is_array($missing) && $missing === []
        );

        $empty = $extractor->getManifestContents($this->componentDir . '/other/empty.manifest.json');
        $this->test(
            "Empty manifest returns an empty array",
            is_array($empty) && $empty === []
        );

        $invalid = $extractor->getManifestContents($this->componentDir . '/other/invalid.manifest.json');
        $this->test(
            "Invalid JSON manifest returns an empty array",
            is_array($invalid) && $invalid === []
        );

        $valid = $extractor->getManifestContents($this->componentDir . '/other/manifest.json');
        $this->test(
            "Valid manifest decodes to an array",
            is_array($valid) && isset($valid['app-entry']) && isset($valid['app-styles'])
        );
    }
    
    private function test($name, $condition) {
        if ($condition) {
            echo "  " . self::GREEN . "✓" . self::NC . " " . $name . "\n";
            $this->passed++;
        } else {
            echo "  " . self::RED . "✗" . self::NC . " " . $name . "\n";
            $this->failed++;
            if ($this->verbose) {
                echo "    " . self::YELLOW . "Condition failed" . self::NC . "\n";
            }
        }
    }
    
    private function teardown() {
        // Clean up temp directory
        if ($this->testDir && is_dir($this->testDir)) {
            $this->removeDirectory($this->testDir);
        }
    }
    
    private function removeDirectory($dir) {
        if (!is_dir($dir)) return;
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }

    private function sanitizeForExpectedId(string $input): string
    {
        return preg_replace('/[^a-zA-Z0-9-]/', '-', $input);
    }
    
    private function resetExtractor() {
        // Reset singleton instance
        if (class_exists('WebComponentsExtractor')) {
            $reflection = new ReflectionClass('WebComponentsExtractor');
            $instance = $reflection->getProperty('instance');
            $instance->setAccessible(true);
            $instance->setValue(null, null);
            
            // Reset static flag
            WebComponentsExtractor::resetScriptsOutput();
        }
    }
    
    private function reportResults() {
        echo "\n";
        echo "========================================\n";
        echo "Test Results:\n";
        echo "  Passed: " . self::GREEN . $this->passed . self::NC . "\n";
        echo "  Failed: " . self::RED . $this->failed . self::NC . "\n";
        echo "========================================\n";
        echo "\n";
        
        if ($this->failed === 0) {
            echo self::GREEN . "All tests passed!" . self::NC . "\n";
            return 0;
        } else {
            echo self::RED . "Some tests failed." . self::NC . "\n";
            return 1;
        }
    }
}

// Run tests
$test = new ExtractorTest();
exit($test->run());
