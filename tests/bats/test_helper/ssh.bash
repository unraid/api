#!/usr/bin/env bash
# ssh.bash - SSH execution helpers for remote server testing
#
# Requires: SERVER environment variable
#
# Usage in tests:
#   load '../test_helper/ssh'

load 'common'

: "${SERVER:?SERVER environment variable must be set}"

# Execute a command on the remote server
remote_exec() {
    ssh -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=accept-new "root@${SERVER}" "$@"
}

# Execute a command on the remote server, ignoring failures (for cleanup)
remote_exec_safe() {
    ssh -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=accept-new "root@${SERVER}" "$@" 2>/dev/null || true
}
