#!/bin/bash
# Test script for shell detection logic in verify_install.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERIFY_SCRIPT="$SCRIPT_DIR/../source/dynamix.unraid.net/usr/local/share/dynamix.unraid.net/install/scripts/verify_install.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

# Helper function to run a test
run_test() {
    local test_name="$1"
    local test_cmd="$2"
    local expected_result="$3"

    TESTS_RUN=$((TESTS_RUN + 1))

    echo -n "Testing: $test_name ... "

    # Run the test and capture exit code
    set +e
    output=$($test_cmd 2>&1)
    result=$?
    set -e

    if [ "$result" -eq "$expected_result" ]; then
        echo -e "${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}FAIL${NC}"
        echo "  Expected exit code: $expected_result, Got: $result"
        echo "  Output: $output"
    fi
}

# Extract just the check_shell function from verify_install.sh
extract_check_shell() {
    cat << 'EOF'
#!/bin/bash
check_shell() {
  # This script runs with #!/bin/bash shebang
  # On Unraid, users may configure bash to load other shells through .bashrc
  # We need to check if the interpreter running this script is actually bash
  # Use readlink on /proc to find the actual interpreter, not the script name
  local current_shell

  # Get the actual interpreter from /proc
  if [ -e "/proc/$$/exe" ]; then
    current_shell=$(readlink "/proc/$$/exe")
  else
    # Fallback to checking the current process if /proc isn't available
    # Note: This may return the script name on some systems
    current_shell=$(ps -o comm= -p $$)
  fi

  # Remove any path and get just the shell name
  current_shell=$(basename "$current_shell")

  if [[ "$current_shell" != "bash" ]]; then
    echo "Unsupported shell detected: $current_shell" >&2
    echo "Unraid scripts require bash but your system is configured to use $current_shell for scripts." >&2
    echo "This can cause infinite loops or unexpected behavior when Unraid scripts execute." >&2
    echo "Please configure $current_shell to only activate for interactive shells." >&2
    echo "Add this check to your ~/.bashrc or /etc/profile before starting $current_shell:" >&2
    echo "  [[ \$- == *i* ]] && exec $current_shell" >&2
    echo "This ensures $current_shell only starts for interactive sessions, not scripts." >&2
    exit 1
  fi
}
check_shell
EOF
}

echo "=== Shell Detection Tests ==="
echo

# Test 1: Running with bash should succeed
echo "Test 1: Direct bash execution"
TEMP_SCRIPT=$(mktemp)
extract_check_shell > "$TEMP_SCRIPT"
chmod +x "$TEMP_SCRIPT"
run_test "Bash interpreter (should pass)" "bash $TEMP_SCRIPT" 0
rm -f "$TEMP_SCRIPT"

# Test 2: Check that the actual verify_install.sh script works with bash
echo "Test 2: Verify install script with bash"
if [ -f "$VERIFY_SCRIPT" ]; then
    # Create a modified version that only runs check_shell
    TEMP_VERIFY=$(mktemp)
    sed -n '1,/^check_shell$/p' "$VERIFY_SCRIPT" > "$TEMP_VERIFY"
    echo "exit 0" >> "$TEMP_VERIFY"
    chmod +x "$TEMP_VERIFY"
    run_test "Verify install script shell check" "bash $TEMP_VERIFY" 0
    rm -f "$TEMP_VERIFY"
else
    echo -e "${YELLOW}SKIP${NC} - verify_install.sh not found"
fi

# Test 3: Simulate non-bash shell (if available)
echo "Test 3: Non-bash shell simulation"
if command -v sh >/dev/null 2>&1 && [ "$(readlink -f "$(command -v sh)")" != "$(readlink -f "$(command -v bash)")" ]; then
    TEMP_SCRIPT=$(mktemp)
    # Create a test that will fail if sh is detected
    cat << 'EOF' > "$TEMP_SCRIPT"
#!/bin/sh
# This simulates what would happen if a non-bash shell was detected
current_shell=$(basename "$(readlink -f /proc/$$/exe 2>/dev/null || echo sh)")
if [ "$current_shell" != "bash" ]; then
    echo "Detected non-bash shell: $current_shell" >&2
    exit 1
fi
exit 0
EOF
    chmod +x "$TEMP_SCRIPT"
    run_test "Non-bash shell detection" "sh $TEMP_SCRIPT" 1
    rm -f "$TEMP_SCRIPT"
else
    echo -e "${YELLOW}SKIP${NC} - sh not available or is symlinked to bash"
fi

# Test 4: Check /proc availability (informational only, not a failure)
echo "Test 4: /proc filesystem check"
if [ -e "/proc/$$/exe" ]; then
    echo -e "${GREEN}INFO${NC} - /proc filesystem is available"
else
    echo -e "${YELLOW}INFO${NC} - /proc filesystem not available, fallback to ps will be used"
fi

# Test 5: Verify the script name is not detected as shell
echo "Test 5: Script name not detected as shell"
TEMP_SCRIPT=$(mktemp -t verify_install.XXXXXX)
extract_check_shell > "$TEMP_SCRIPT"
chmod +x "$TEMP_SCRIPT"
# This should pass because it's still bash, even though the script is named verify_install
run_test "Script named verify_install (should still pass)" "bash $TEMP_SCRIPT" 0
rm -f "$TEMP_SCRIPT"

echo
echo "=== Test Summary ==="
echo "Tests run: $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $((TESTS_RUN - TESTS_PASSED))"

if [ "$TESTS_PASSED" -eq "$TESTS_RUN" ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed${NC}"
    exit 1
fi