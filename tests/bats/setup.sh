#!/usr/bin/env bash
# setup.sh - Setup symlinks for BATS libraries from node_modules
#
# This script is called by postinstall to link bats-support and bats-assert
# from node_modules into test_helper/ where BATS can load them.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_MODULES="$SCRIPT_DIR/node_modules"

# Create test_helper directory if needed
mkdir -p "$SCRIPT_DIR/test_helper"

# Create symlinks (use -f to overwrite existing)
if [[ -d "$NODE_MODULES/bats-support" ]]; then
    ln -sfn "$NODE_MODULES/bats-support" "$SCRIPT_DIR/test_helper/bats-support"
fi

if [[ -d "$NODE_MODULES/bats-assert" ]]; then
    ln -sfn "$NODE_MODULES/bats-assert" "$SCRIPT_DIR/test_helper/bats-assert"
fi

echo "BATS libraries linked successfully"
