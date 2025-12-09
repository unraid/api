#!/usr/bin/env bats
# singleton.bats - Tests for unraid-api singleton process management
#
# Usage: SERVER=<server_name> bats singleton.bats
#
# These tests verify that the unraid-api is properly daemonized as a singleton process.
# See: https://bats-core.readthedocs.io/en/stable/writing-tests.html

# -----------------------------------------------------------------------------
# Test Setup
# -----------------------------------------------------------------------------

# setup_file runs once before all tests in this file
# Load helpers here since they're needed for all tests
# See: https://bats-core.readthedocs.io/en/stable/writing-tests.html#setup-and-teardown-pre-and-post-test-hooks
setup_file() {
    load 'test_helper'
}

# Setup runs before each test - ensure clean state
setup() {
    load 'test_helper'
    cleanup
}

# Teardown runs after each test - clean up
teardown() {
    cleanup
}

# -----------------------------------------------------------------------------
# Start Command Tests
# -----------------------------------------------------------------------------

@test "start: creates a single process with PID file" {
    # Start the API
    run start_api
    [ "$status" -eq 0 ]

    # Verify PID file exists
    run pid_file_exists
    [ "$status" -eq 0 ]

    # Verify PID is valid (non-empty and numeric)
    pid=$(get_remote_pid)
    [ -n "$pid" ]
    [[ "$pid" =~ ^[0-9]+$ ]]

    # Verify process is running
    run is_process_running "$pid"
    [ "$status" -eq 0 ]

    # Verify exactly ONE nodemon AND ONE main.js
    run assert_single_api_instance
    [ "$status" -eq 0 ]
}

@test "start: second start does not create duplicate process" {
    # Start the API first
    run start_api
    [ "$status" -eq 0 ]

    # Get the initial PID
    initial_pid=$(get_remote_pid)
    [ -n "$initial_pid" ]

    # Verify single instance initially
    run assert_single_api_instance
    [ "$status" -eq 0 ]

    # Try to start again
    run remote_exec "unraid-api start"
    # Should succeed (either no-op or restart)

    # Wait a moment for any process changes
    sleep 2

    # Verify still exactly one nodemon AND one main.js (singleton enforcement)
    run assert_single_api_instance
    [ "$status" -eq 0 ]

    # Verify process is still running (either same or new PID after restart)
    run pid_file_exists
    [ "$status" -eq 0 ]

    final_pid=$(get_remote_pid)
    [ -n "$final_pid" ]

    run is_process_running "$final_pid"
    [ "$status" -eq 0 ]
}

@test "start: cleans up stale PID file" {
    # Create a stale PID file with a non-existent PID
    run remote_exec "mkdir -p /var/run/unraid-api && echo '99999' > '${REMOTE_PID_PATH}'"
    [ "$status" -eq 0 ]

    # Start should clean up and proceed
    run start_api
    [ "$status" -eq 0 ]

    # Verify new valid PID (not the stale one)
    pid=$(get_remote_pid)
    [ -n "$pid" ]
    [ "$pid" != "99999" ]

    # Verify process is actually running
    run is_process_running "$pid"
    [ "$status" -eq 0 ]
}

@test "start: cleans up orphaned nodemon process" {
    # Start API normally
    run start_api
    [ "$status" -eq 0 ]

    # Remove PID file but leave process running (simulate orphan)
    run remote_exec "rm -f '${REMOTE_PID_PATH}'"
    [ "$status" -eq 0 ]

    # Verify orphaned process still running
    count=$(count_nodemon_processes)
    [ "$count" -eq 1 ]

    # Start should detect orphan and clean it up
    run start_api
    [ "$status" -eq 0 ]

    # Should still have exactly one process
    count=$(count_nodemon_processes)
    [ "$count" -eq 1 ]

    # PID file should exist again
    run pid_file_exists
    [ "$status" -eq 0 ]
}

# -----------------------------------------------------------------------------
# Status Command Tests
# -----------------------------------------------------------------------------

@test "status: reports running when API is active" {
    # Start the API
    run start_api
    [ "$status" -eq 0 ]

    # Check status - should contain "running"
    output=$(get_status)
    [[ "$output" == *"running"* ]]
}

@test "status: reports not running when API is stopped" {
    # Ensure API is stopped (cleanup already called in setup)

    # Check status - should indicate not running
    output=$(get_status)
    [[ "$output" == *"not running"* ]]
}

# -----------------------------------------------------------------------------
# Stop Command Tests
# -----------------------------------------------------------------------------

@test "stop: cleanly terminates all processes" {
    # Start the API first
    run start_api
    [ "$status" -eq 0 ]

    # Verify it's running
    pid=$(get_remote_pid)
    [ -n "$pid" ]

    # Verify single instance before stop
    run assert_single_api_instance
    [ "$status" -eq 0 ]

    # Stop the API
    run stop_api
    [ "$status" -eq 0 ]

    # Verify PID file is removed
    run pid_file_exists
    [ "$status" -ne 0 ]

    # Verify NO nodemon AND NO main.js processes remain
    run assert_no_api_processes
    [ "$status" -eq 0 ]
}

@test "stop --force: terminates all processes immediately" {
    # Start the API
    run start_api
    [ "$status" -eq 0 ]

    # Get the PID
    pid=$(get_remote_pid)
    [ -n "$pid" ]

    # Verify single instance before stop
    run assert_single_api_instance
    [ "$status" -eq 0 ]

    # Force stop
    run stop_api --force
    [ "$status" -eq 0 ]

    # Verify PID file is removed
    run pid_file_exists
    [ "$status" -ne 0 ]

    # Verify NO processes remain (nodemon AND main.js)
    run assert_no_api_processes
    [ "$status" -eq 0 ]
}

# -----------------------------------------------------------------------------
# Restart Command Tests
# -----------------------------------------------------------------------------

@test "restart: creates new process when already running" {
    # Start the API
    run start_api
    [ "$status" -eq 0 ]

    # Get the initial PID
    initial_pid=$(get_remote_pid)
    [ -n "$initial_pid" ]

    # Verify single instance initially
    run assert_single_api_instance
    [ "$status" -eq 0 ]

    # Restart the API
    run remote_exec "unraid-api restart"
    [ "$status" -eq 0 ]

    # Wait for restart to complete
    sleep 3
    run wait_for_start 10
    [ "$status" -eq 0 ]

    # Get new PID
    new_pid=$(get_remote_pid)
    [ -n "$new_pid" ]

    # PIDs should be different (process was actually restarted)
    [ "$initial_pid" != "$new_pid" ]

    # Verify exactly one nodemon AND one main.js after restart
    run assert_single_api_instance
    [ "$status" -eq 0 ]
}

@test "restart: works when API is not running" {
    # Ensure API is stopped (cleanup already called in setup)

    # Restart should start the API
    run remote_exec "unraid-api restart"
    [ "$status" -eq 0 ]

    # Wait for start
    run wait_for_start 10
    [ "$status" -eq 0 ]

    # Verify process is running
    pid=$(get_remote_pid)
    [ -n "$pid" ]

    run is_process_running "$pid"
    [ "$status" -eq 0 ]
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
    [ "$status" -eq 0 ]

    # PID file should exist
    run pid_file_exists
    [ "$status" -eq 0 ]
}

@test "recovery: API recovers after process is killed externally" {
    # Start the API
    run start_api
    [ "$status" -eq 0 ]

    pid=$(get_remote_pid)
    [ -n "$pid" ]

    # Kill the process directly (simulate crash)
    run remote_exec "kill -9 '$pid'"

    # Wait for process to die
    sleep 1

    # Start should recover
    run start_api
    [ "$status" -eq 0 ]

    # Verify new process running
    new_pid=$(get_remote_pid)
    [ -n "$new_pid" ]

    run is_process_running "$new_pid"
    [ "$status" -eq 0 ]
}
