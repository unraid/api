#!/usr/bin/env bash
# unraid-api.bash - Helpers for testing unraid-api daemon process management
#
# Requires: SERVER environment variable
#
# Usage in tests:
#   load '../test_helper/unraid-api'

load 'ssh'

# Remote paths
export REMOTE_PID_PATH="/var/run/unraid-api/nodemon.pid"

# Timeouts (seconds)
export DEFAULT_TIMEOUT=10

# -----------------------------------------------------------------------------
# Process Query Helpers
# -----------------------------------------------------------------------------

# Get the PID from the remote PID file, returns empty if not found
get_remote_pid() {
    remote_exec "cat '${REMOTE_PID_PATH}' 2>/dev/null || true" | tr -d '[:space:]'
}

# Check if the PID file exists on the remote server (returns 0 if exists, 1 if not)
pid_file_exists() {
    remote_exec "test -f '${REMOTE_PID_PATH}'" 2>/dev/null
}

# Check if a process is running on the remote server
is_process_running() {
    local pid="$1"
    [[ -n "$pid" ]] && remote_exec "kill -0 '${pid}' 2>/dev/null"
}

# Count nodemon processes matching our config on remote server
count_nodemon_processes() {
    local result
    result=$(remote_exec "ps -eo pid,args 2>/dev/null | grep -E 'nodemon.*nodemon.json' | grep -v grep | wc -l" 2>/dev/null || echo "0")
    echo "${result}" | tr -d '[:space:]'
}

# Count main.js worker processes (children of nodemon)
count_main_processes() {
    local result
    result=$(remote_exec "ps -eo args 2>/dev/null | grep -E 'node.*dist/main\.js' | grep -v grep | wc -l" 2>/dev/null || echo "0")
    echo "${result}" | tr -d '[:space:]'
}

# Count all unraid-api related processes (nodemon + main.js)
count_unraid_api_processes() {
    local nodemon_count main_count
    nodemon_count=$(count_nodemon_processes)
    main_count=$(count_main_processes)
    echo $((nodemon_count + main_count))
}

# -----------------------------------------------------------------------------
# Process Assertions
# -----------------------------------------------------------------------------

# Assert exactly one nodemon and one main.js process
assert_single_api_instance() {
    local nodemon_count main_count
    nodemon_count=$(count_nodemon_processes)
    main_count=$(count_main_processes)

    if [[ "$nodemon_count" -ne 1 ]]; then
        echo "Expected 1 nodemon process, found $nodemon_count" >&2
        remote_exec "ps -eo pid,args | grep -E 'nodemon|main.js' | grep -v grep" >&2
        return 1
    fi

    if [[ "$main_count" -ne 1 ]]; then
        echo "Expected 1 main.js process, found $main_count" >&2
        remote_exec "ps -eo pid,args | grep -E 'nodemon|main.js' | grep -v grep" >&2
        return 1
    fi

    return 0
}

# Assert no API processes running
assert_no_api_processes() {
    local nodemon_count main_count
    nodemon_count=$(count_nodemon_processes)
    main_count=$(count_main_processes)

    if [[ "$nodemon_count" -ne 0 ]] || [[ "$main_count" -ne 0 ]]; then
        echo "Expected 0 processes, found nodemon=$nodemon_count main.js=$main_count" >&2
        remote_exec "ps -eo pid,args | grep -E 'nodemon|main.js' | grep -v grep" >&2
        return 1
    fi

    return 0
}

# -----------------------------------------------------------------------------
# Wait Helpers
# -----------------------------------------------------------------------------

# Wait for a process to start (PID file to exist and process running)
wait_for_start() {
    local timeout="${1:-$DEFAULT_TIMEOUT}"
    local deadline=$((SECONDS + timeout))

    while [[ $SECONDS -lt $deadline ]]; do
        local pid
        pid=$(get_remote_pid)
        if [[ -n "$pid" ]] && is_process_running "$pid"; then
            return 0
        fi
        sleep 1
    done

    return 1
}

# Wait for a process to stop (PID file removed or process not running)
wait_for_stop() {
    local timeout="${1:-$DEFAULT_TIMEOUT}"
    local deadline=$((SECONDS + timeout))

    while [[ $SECONDS -lt $deadline ]]; do
        local pid
        pid=$(get_remote_pid)
        if [[ -z "$pid" ]]; then
            return 0
        fi
        if ! is_process_running "$pid"; then
            return 0
        fi
        sleep 1
    done

    return 1
}

# Wait for all unraid-api processes to stop
wait_for_all_processes_stop() {
    local timeout="${1:-$DEFAULT_TIMEOUT}"
    local deadline=$((SECONDS + timeout))

    while [[ $SECONDS -lt $deadline ]]; do
        local count
        count=$(count_unraid_api_processes)
        if [[ "$count" -eq 0 ]]; then
            return 0
        fi
        sleep 1
    done

    return 1
}

# -----------------------------------------------------------------------------
# API Lifecycle Helpers
# -----------------------------------------------------------------------------

# Clean up: stop any running unraid-api processes
cleanup() {
    # Step 1: Try graceful stop via unraid-api
    remote_exec_safe "unraid-api stop 2>/dev/null; true"
    sleep 1

    # Step 2: Check if processes remain
    local count
    count=$(count_unraid_api_processes)
    if [[ "$count" -eq 0 ]]; then
        remote_exec_safe "rm -f '${REMOTE_PID_PATH}' 2>/dev/null; true"
        return 0
    fi

    # Step 3: Force kill - nodemon FIRST (prevents restart of child)
    remote_exec_safe "pkill -KILL -f 'nodemon.*nodemon.json' 2>/dev/null; true"
    sleep 0.5

    # Step 4: Force kill - then main.js children
    remote_exec_safe "pkill -KILL -f 'node.*dist/main.js' 2>/dev/null; true"
    sleep 1

    # Step 5: Clean up PID file
    remote_exec_safe "rm -f '${REMOTE_PID_PATH}' 2>/dev/null; true"

    # Step 6: Verify - if still running, try harder with explicit PIDs
    count=$(count_unraid_api_processes)
    if [[ "$count" -ne 0 ]]; then
        local pids
        pids=$(remote_exec_safe "ps -eo pid,args | grep -E 'nodemon.*nodemon.json|node.*dist/main.js' | grep -v grep | awk '{print \$1}'" 2>/dev/null || true)
        for pid in $pids; do
            remote_exec_safe "kill -9 $pid 2>/dev/null; true"
        done
        sleep 1
    fi

    # Final check
    count=$(count_unraid_api_processes)
    if [[ "$count" -ne 0 ]]; then
        echo "WARNING: Cleanup incomplete, remaining processes:" >&2
        remote_exec_safe "ps -eo pid,args | grep -E 'nodemon|main.js' | grep -v grep" >&2
    fi

    return 0
}

# Start the API and wait for it to be ready
start_api() {
    remote_exec "unraid-api start"
    wait_for_start
}

# Stop the API using unraid-api stop command
stop_api() {
    local force="${1:-}"
    if [[ "$force" == "--force" ]]; then
        remote_exec "unraid-api stop --force"
    else
        remote_exec "unraid-api stop"
    fi

    wait_for_stop
    wait_for_all_processes_stop 10
}

# Get status output from remote
get_status() {
    remote_exec "unraid-api status 2>&1" || true
}
