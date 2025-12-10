#!/usr/bin/env bats
# singleton_daemon.bats - Tests for unraid-api singleton daemon process management
#
# Usage: SERVER=<server_name> bats singleton.bats
#        SERVER=<server_name> pnpm test:bats:integration
#
# These tests verify that the unraid-api is properly daemonized as a singleton process.
# See: https://bats-core.readthedocs.io/en/stable/writing-tests.html

# -----------------------------------------------------------------------------
# Test Setup
# -----------------------------------------------------------------------------

# setup_file runs once before all tests in this file
setup_file() {
    load '../test_helper/unraid-api'
}

# Setup runs before each test - ensure clean state
setup() {
    load '../test_helper/unraid-api'
    cleanup
}

# Teardown runs after each test - clean up
teardown() {
    cleanup
}

teardown_file() {
    load '../test_helper/unraid-api'
    start_api
}

# -----------------------------------------------------------------------------
# Start Command Tests
# -----------------------------------------------------------------------------

@test "start: creates a single process with PID file" {
    # Start the API
    run start_api
    assert_success

    # Verify PID file exists
    run pid_file_exists
    assert_success

    # Verify PID is valid (non-empty and numeric)
    pid=$(get_remote_pid)
    assert [ -n "$pid" ]
    assert_regex "$pid" '^[0-9]+$'

    # Verify process is running
    run is_process_running "$pid"
    assert_success

    # Verify exactly ONE nodemon AND ONE main.js
    run assert_single_api_instance
    assert_success
}

@test "start: second start does not create duplicate process" {
    # Start the API first
    run start_api
    assert_success

    # Get the initial PID
    initial_pid=$(get_remote_pid)
    assert [ -n "$initial_pid" ]

    # Verify single instance initially
    run assert_single_api_instance
    assert_success

    # Try to start again
    run remote_exec "unraid-api start"
    # Should succeed (either no-op or restart)

    # Wait a moment for any process changes
    sleep 2

    # Verify still exactly one nodemon AND one main.js (singleton enforcement)
    run assert_single_api_instance
    assert_success

    # Verify process is still running (either same or new PID after restart)
    run pid_file_exists
    assert_success

    final_pid=$(get_remote_pid)
    assert [ -n "$final_pid" ]

    run is_process_running "$final_pid"
    assert_success
}

@test "start: cleans up stale PID file" {
    # Create a stale PID file with a non-existent PID
    run remote_exec "mkdir -p /var/run/unraid-api && echo '99999' > '${REMOTE_PID_PATH}'"
    assert_success

    # Start should clean up and proceed
    run start_api
    assert_success

    # Verify new valid PID (not the stale one)
    pid=$(get_remote_pid)
    assert [ -n "$pid" ]
    assert [ "$pid" != "99999" ]

    # Verify process is actually running
    run is_process_running "$pid"
    assert_success
}

@test "start: cleans up orphaned nodemon process" {
    # Start API normally
    run start_api
    assert_success

    # Remove PID file but leave process running (simulate orphan)
    run remote_exec "rm -f '${REMOTE_PID_PATH}'"
    assert_success

    # Verify orphaned process still running
    count=$(count_nodemon_processes)
    assert [ "$count" -eq 1 ]

    # Start should detect orphan and clean it up
    run start_api
    assert_success

    # Should still have exactly one process
    count=$(count_nodemon_processes)
    assert [ "$count" -eq 1 ]

    # PID file should exist again
    run pid_file_exists
    assert_success
}

# -----------------------------------------------------------------------------
# Status Command Tests
# -----------------------------------------------------------------------------

@test "status: reports running when API is active" {
    # Start the API
    run start_api
    assert_success

    # Check status - should contain "running"
    output=$(get_status)
    assert_regex "$output" "running"
}

@test "status: reports not running when API is stopped" {
    # Ensure API is stopped (cleanup already called in setup)

    # Check status - should indicate not running
    output=$(get_status)
    assert_regex "$output" "not running"
}

# -----------------------------------------------------------------------------
# Stop Command Tests
# -----------------------------------------------------------------------------

@test "stop: cleanly terminates all processes" {
    # Start the API first
    run start_api
    assert_success

    # Verify it's running
    pid=$(get_remote_pid)
    assert [ -n "$pid" ]

    # Verify single instance before stop
    run assert_single_api_instance
    assert_success

    # Stop the API
    run stop_api
    assert_success

    # Verify PID file is removed
    run pid_file_exists
    assert_failure

    # Verify NO nodemon AND NO main.js processes remain
    run assert_no_api_processes
    assert_success
}

@test "stop --force: terminates all processes immediately" {
    # Start the API
    run start_api
    assert_success

    # Get the PID
    pid=$(get_remote_pid)
    assert [ -n "$pid" ]

    # Verify single instance before stop
    run assert_single_api_instance
    assert_success

    # Force stop
    run stop_api --force
    assert_success

    # Verify PID file is removed
    run pid_file_exists
    assert_failure

    # Verify NO processes remain (nodemon AND main.js)
    run assert_no_api_processes
    assert_success
}

# -----------------------------------------------------------------------------
# Restart Command Tests
# -----------------------------------------------------------------------------

@test "restart: creates new process when already running" {
    # Start the API
    run start_api
    assert_success

    # Get the initial PID
    initial_pid=$(get_remote_pid)
    assert [ -n "$initial_pid" ]

    # Verify single instance initially
    run assert_single_api_instance
    assert_success

    # Restart the API
    run remote_exec "unraid-api restart"
    assert_success

    # Wait for restart to complete
    sleep 3
    run wait_for_start 10
    assert_success

    # Get new PID
    new_pid=$(get_remote_pid)
    assert [ -n "$new_pid" ]

    # PIDs should be different (process was actually restarted)
    assert [ "$initial_pid" != "$new_pid" ]

    # Verify exactly one nodemon AND one main.js after restart
    run assert_single_api_instance
    assert_success
}

@test "restart: works when API is not running" {
    # Ensure API is stopped (cleanup already called in setup)

    # Restart should start the API
    run remote_exec "unraid-api restart"
    assert_success

    # Wait for start
    run wait_for_start 10
    assert_success

    # Verify process is running
    pid=$(get_remote_pid)
    assert [ -n "$pid" ]

    run is_process_running "$pid"
    assert_success
}

# -----------------------------------------------------------------------------
# Edge Case Tests
# -----------------------------------------------------------------------------

@test "concurrent starts: result in single process" {
    # Launch multiple starts concurrently
    run remote_exec "unraid-api start & unraid-api start & wait"

    # Wait for things to settle
    sleep 3

    # Must have exactly one nodemon AND one main.js, not just "one nodemon"
    run assert_single_api_instance
    assert_success

    # PID file should exist
    run pid_file_exists
    assert_success
}

@test "recovery: API recovers after process is killed externally" {
    # Start the API
    run start_api
    assert_success

    pid=$(get_remote_pid)
    assert [ -n "$pid" ]

    # Kill the process directly (simulate crash)
    run remote_exec "kill -9 '$pid'"

    # Wait for process to die
    sleep 1

    # Start should recover
    run start_api
    assert_success

    # Verify new process running
    new_pid=$(get_remote_pid)
    assert [ -n "$new_pid" ]

    run is_process_running "$new_pid"
    assert_success
}
