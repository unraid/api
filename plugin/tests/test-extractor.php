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
            'standalone-apps-RlN0czLV.css' => [
                'file' => 'standalone-apps-RlN0czLV.css',
                'src' => 'standalone-apps-RlN0czLV.css'
            ],
            'standalone-apps.js' => [
                'file' => 'standalone-apps.js',
                'src' => 'standalone-apps.js',
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
    
    private function getExtractorOutput() {
        $_SERVER['DOCUMENT_ROOT'] = '/usr/local/emhttp';
        require_once $this->testDir . '/extractor.php';
        
        $extractor = WebComponentsExtractor::getInstance();
        return $extractor->getScriptTagHtml();
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
            "Generates script tag for standalone-apps.js",
            strpos($output, 'script id="unraid-standalone-apps-standalone-apps-js"') !== false
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
            "Generates link tag for standalone CSS",
            strpos($output, 'link id="unraid-standalone-apps-standalone-apps-RlN0czLV-css"') !== false
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
            strpos($output, '/plugins/dynamix.my.servers/unraid-components/standalone-apps/standalone-apps.js') !== false
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
            strpos($output, 'id="unraid-standalone-apps-standalone-apps-js-css-app-styles-css"') !== false
        );
        $this->test(
            "Loads CSS from JS entry css array (theme.css)",
            strpos($output, 'id="unraid-standalone-apps-standalone-apps-js-css-theme-css"') !== false
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