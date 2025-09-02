#!/bin/bash

# WebComponentsExtractor Integration Test
# 
# This script tests the WebComponentsExtractor functionality
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Create temp directory for testing
TEST_DIR=$(mktemp -d)
COMPONENT_DIR="$TEST_DIR/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components"

# Cleanup function
cleanup() {
    rm -rf "$TEST_DIR"
}
trap cleanup EXIT

# Setup test environment
setup() {
    echo "Setting up test environment..."
    
    # Create directory structure
    mkdir -p "$COMPONENT_DIR/standalone-apps"
    mkdir -p "$COMPONENT_DIR/ui-components"
    mkdir -p "$COMPONENT_DIR/other"
    
    # Create test manifest files
    cat > "$COMPONENT_DIR/standalone-apps/standalone.manifest.json" << 'EOF'
{
    "standalone-apps-RlN0czLV.css": {
        "file": "standalone-apps-RlN0czLV.css",
        "src": "standalone-apps-RlN0czLV.css"
    },
    "standalone-apps.js": {
        "file": "standalone-apps.js",
        "src": "standalone-apps.js"
    },
    "ts": 1234567890
}
EOF
    
    cat > "$COMPONENT_DIR/ui-components/ui.manifest.json" << 'EOF'
{
    "ui-styles": {
        "file": "ui-components.css"
    },
    "ui-script": {
        "file": "components.mjs"
    },
    "invalid-entry": {
        "notAFile": "should be skipped"
    },
    "empty-file": {
        "file": ""
    }
}
EOF
    
    cat > "$COMPONENT_DIR/other/manifest.json" << 'EOF'
{
    "app-entry": {
        "file": "app.js"
    },
    "app-styles": {
        "file": "app.css"
    }
}
EOF
    
    # Create the test PHP script
    cat > "$TEST_DIR/run-extractor.php" << 'EOF'
<?php
// Set document root
$_SERVER['DOCUMENT_ROOT'] = '/usr/local/emhttp';

// Load the extractor
require_once dirname(__FILE__) . '/extractor.php';

// Get instance and generate HTML
$extractor = WebComponentsExtractor::getInstance();
echo $extractor->getScriptTagHtml();
EOF
    
    # Copy the extractor with modified paths
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    EXTRACTOR_PATH="$SCRIPT_DIR/../source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers/include/web-components-extractor.php"
    
    # Modify the extractor to use test directory
    sed "s|'/usr/local/emhttp' \. self::PREFIXED_PATH|'$TEST_DIR/usr/local/emhttp' . self::PREFIXED_PATH|g" \
        "$EXTRACTOR_PATH" > "$TEST_DIR/extractor.php"
}

# Test function
test() {
    local test_name="$1"
    local condition="$2"
    
    if eval "$condition"; then
        echo -e "  ${GREEN}✓${NC} $test_name"
        ((TESTS_PASSED++))
    else
        echo -e "  ${RED}✗${NC} $test_name"
        ((TESTS_FAILED++))
    fi
}

# Run tests
run_tests() {
    echo ""
    echo "========================================"
    echo "   WebComponentsExtractor Test Suite"
    echo "========================================"
    echo ""
    
    # Generate the HTML output
    OUTPUT=$(php "$TEST_DIR/run-extractor.php" 2>&1)
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -ne 0 ]; then
        echo -e "${RED}Failed to run extractor:${NC}"
        echo "$OUTPUT"
        exit 1
    fi
    
    # Debug output if VERBOSE is set
    if [ "${VERBOSE:-0}" = "1" ]; then
        echo -e "${YELLOW}Generated output:${NC}"
        echo "$OUTPUT"
        echo ""
    fi
    
    echo "Test: Script Tag Generation"
    echo "----------------------------"
    test "Generates script tag for standalone-apps.js" \
         "[[ \"\$OUTPUT\" == *'script id=\"unraid-standalone-apps-js\"'* ]]"
    
    test "Generates script tag for components.mjs" \
         "[[ \"\$OUTPUT\" == *'script id=\"unraid-ui-script\"'* ]]"
    
    test "Generates script tag for app.js" \
         "[[ \"\$OUTPUT\" == *'script id=\"unraid-app-entry\"'* ]]"
    
    echo ""
    echo "Test: CSS Link Generation"
    echo "--------------------------"
    test "Generates link tag for standalone CSS" \
         "[[ \"\$OUTPUT\" == *'link id=\"unraid-standalone-apps-RlN0czLV-css\"'* ]]"
    
    test "Generates link tag for UI styles" \
         "[[ \"\$OUTPUT\" == *'link id=\"unraid-ui-styles\"'* ]]"
    
    test "Generates link tag for app styles" \
         "[[ \"\$OUTPUT\" == *'link id=\"unraid-app-styles\"'* ]]"
    
    echo ""
    echo "Test: Invalid Entries Handling"
    echo "-------------------------------"
    test "Skips entries without 'file' key" \
         "[[ \"\$OUTPUT\" != *'notAFile'* ]]"
    
    test "Skips invalid entry content" \
         "[[ \"\$OUTPUT\" != *'should be skipped'* ]]"
    
    test "Skips entries with empty file value" \
         "[[ \"\$OUTPUT\" != *'empty-file'* ]]"
    
    echo ""
    echo "Test: Deduplication Script"
    echo "---------------------------"
    test "Includes deduplication script" \
         "[[ \"\$OUTPUT\" == *'Remove duplicate resource tags'* ]]"
    
    test "Deduplication targets correct elements" \
         "[[ \"\$OUTPUT\" == *'document.querySelectorAll'* ]]"
    
    echo ""
    echo "Test: Path Construction"
    echo "------------------------"
    test "Correctly constructs standalone-apps path" \
         "[[ \"\$OUTPUT\" == *'/plugins/dynamix.my.servers/unraid-components/standalone-apps/standalone-apps.js'* ]]"
    
    test "Correctly constructs ui-components path" \
         "[[ \"\$OUTPUT\" == *'/plugins/dynamix.my.servers/unraid-components/ui-components/components.mjs'* ]]"
    
    test "Correctly constructs generic manifest path" \
         "[[ \"\$OUTPUT\" == *'/plugins/dynamix.my.servers/unraid-components/other/app.js'* ]]"
    
    echo ""
    echo "Test: Duplicate Prevention"
    echo "---------------------------"
    # Create a test for duplicate prevention
    cat > "$TEST_DIR/test-duplicate.php" << 'EOF'
<?php
$_SERVER['DOCUMENT_ROOT'] = '/usr/local/emhttp';
require_once dirname(__FILE__) . '/extractor.php';
$extractor = WebComponentsExtractor::getInstance();
$first = $extractor->getScriptTagHtml();
$second = $extractor->getScriptTagHtml();
if (strpos($second, 'Resources already loaded') !== false) {
    echo "PASS";
} else {
    echo "FAIL";
}
EOF
    
    DUPLICATE_TEST=$(php "$TEST_DIR/test-duplicate.php")
    test "Second call returns 'already loaded' message" \
         "[[ \"$DUPLICATE_TEST\" == 'PASS' ]]"
}

# Main execution
main() {
    setup
    run_tests
    
    echo ""
    echo "========================================"
    echo "Test Results:"
    echo -e "  Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "  Failed: ${RED}$TESTS_FAILED${NC}"
    echo "========================================"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed.${NC}"
        exit 1
    fi
}

# Run if executed directly
main "$@"