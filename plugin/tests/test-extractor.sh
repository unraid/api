#!/bin/bash

# WebComponentsExtractor Integration Test
# 
# This script runs the PHP test suite for WebComponentsExtractor
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed

set -e  # Exit on error

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the PHP test suite
exec php "$SCRIPT_DIR/test-extractor.php" "$@"