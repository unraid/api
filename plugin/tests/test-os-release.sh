#!/bin/bash

# OsRelease helper test
#
# Runs the PHP test suite for the shared OS release branch/version helper.
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

exec php "$SCRIPT_DIR/test-os-release.php" "$@"
