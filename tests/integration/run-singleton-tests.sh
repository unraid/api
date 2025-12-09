#!/usr/bin/env bash
#
# run-singleton-tests.sh - Run singleton process management tests against a remote Unraid server
#
# Usage: ./run-singleton-tests.sh <server_name>
#
# Arguments:
#   server_name  SSH server name or IP address (required)
#
# Requirements:
#   - BATS (Bash Automated Testing System) installed
#   - SSH access to the target server as root
#   - unraid-api already deployed on the target server
#
# See: https://bats-core.readthedocs.io/en/stable/

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_error() {
    echo -e "${RED}Error: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_info() {
    echo "$1"
}

usage() {
    cat << EOF
Usage: $(basename "$0") <server_name>

Run singleton process management tests against a remote Unraid server.

Arguments:
    server_name    SSH server name or IP address (required)

Options:
    -h, --help     Show this help message

Examples:
    $(basename "$0") tower
    $(basename "$0") 192.168.1.100
    $(basename "$0") unraid.local

Requirements:
    - BATS (Bash Automated Testing System) installed
      Install: brew install bats-core (macOS) or apt install bats (Ubuntu)
    - SSH access to the target server as root
    - unraid-api already deployed on the target server
EOF
}

check_bats() {
    if ! command -v bats &> /dev/null; then
        print_error "BATS is not installed."
        echo ""
        echo "Install BATS using one of these methods:"
        echo "  macOS:   brew install bats-core"
        echo "  Ubuntu:  apt-get install bats"
        echo "  npm:     npm install -g bats"
        echo ""
        echo "Or visit: https://github.com/bats-core/bats-core"
        exit 1
    fi

    print_success "BATS is installed: $(bats --version)"
}

check_ssh() {
    local server="$1"

    print_info "Checking SSH connectivity to ${server}..."

    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "root@${server}" 'echo "SSH OK"' &> /dev/null; then
        print_error "Cannot connect to ${server} via SSH."
        echo ""
        echo "Please ensure:"
        echo "  1. The server name/IP is correct"
        echo "  2. SSH is running on the server"
        echo "  3. You have SSH key access as root"
        echo ""
        echo "Test manually with: ssh root@${server}"
        exit 1
    fi

    print_success "SSH connection successful"
}

check_unraid_api() {
    local server="$1"

    print_info "Checking if unraid-api is installed on ${server}..."

    if ! ssh -o ConnectTimeout=10 "root@${server}" 'command -v unraid-api' &> /dev/null; then
        print_error "unraid-api is not installed on ${server}."
        echo ""
        echo "Please deploy unraid-api first using:"
        echo "  cd api && ./scripts/deploy-dev.sh ${server}"
        exit 1
    fi

    print_success "unraid-api is installed"
}

main() {
    # Parse arguments
    if [[ $# -eq 0 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
        usage
        exit 0
    fi

    local server="$1"

    echo ""
    echo "========================================"
    echo "Unraid API Singleton Process Tests"
    echo "========================================"
    echo ""
    echo "Target server: ${server}"
    echo ""

    # Pre-flight checks
    check_bats
    check_ssh "$server"
    check_unraid_api "$server"

    echo ""
    print_info "Running tests..."
    echo ""

    # Run BATS tests with SERVER environment variable
    export SERVER="$server"

    if bats "${SCRIPT_DIR}/singleton.bats"; then
        echo ""
        print_success "All tests passed!"
        exit 0
    else
        echo ""
        print_error "Some tests failed."
        exit 1
    fi
}

main "$@"
