#!/usr/bin/env bats
# example.bats - Example test file demonstrating bats-assert and bats-support
#
# Run with: pnpm test:bats
# Or directly: bats tests/bats/examples/example.bats
#
# This file demonstrates common BATS patterns and assertions.
# Delete or modify this file as needed.

# -----------------------------------------------------------------------------
# Setup
# -----------------------------------------------------------------------------

setup() {
    # Load assertion libraries
    load '../test_helper/bats-support/load'
    load '../test_helper/bats-assert/load'
}

# -----------------------------------------------------------------------------
# Basic Assertions
# -----------------------------------------------------------------------------

@test "assert_success: command exits with status 0" {
    run echo "hello"
    assert_success
}

@test "assert_failure: command exits with non-zero status" {
    run false
    assert_failure
}

@test "assert_failure with specific exit code" {
    run bash -c "exit 42"
    assert_failure 42
}

# -----------------------------------------------------------------------------
# Output Assertions
# -----------------------------------------------------------------------------

@test "assert_output: exact match" {
    run echo "hello world"
    assert_output "hello world"
}

@test "assert_output --partial: contains substring" {
    run echo "hello world"
    assert_output --partial "world"
}

@test "assert_output --regexp: matches regex" {
    run echo "file_2024_01_15.txt"
    assert_output --regexp "file_[0-9]{4}_[0-9]{2}_[0-9]{2}\.txt"
}

@test "refute_output: output does NOT contain" {
    run echo "success"
    refute_output --partial "error"
}

# -----------------------------------------------------------------------------
# Line Assertions
# -----------------------------------------------------------------------------

@test "assert_line: output contains line" {
    run bash -c "echo -e 'line1\nline2\nline3'"
    assert_line "line2"
}

@test "assert_line --index: specific line number" {
    run bash -c "echo -e 'first\nsecond\nthird'"
    assert_line --index 0 "first"
    assert_line --index 1 "second"
    assert_line --index 2 "third"
}

@test "assert_line --partial: line contains substring" {
    run bash -c "echo -e 'error: something failed\nwarning: check this'"
    assert_line --partial "something failed"
}

@test "refute_line: output does NOT contain line" {
    run bash -c "echo -e 'info: ok\ninfo: done'"
    refute_line --partial "error"
}

# -----------------------------------------------------------------------------
# Variable Assertions
# -----------------------------------------------------------------------------

@test "assert: test expression" {
    result="hello"
    assert [ -n "$result" ]
    assert [ "$result" = "hello" ]
}

@test "assert_equal: two values are equal" {
    expected="42"
    actual="42"
    assert_equal "$expected" "$actual"
}

@test "assert_not_equal: two values differ" {
    value1="foo"
    value2="bar"
    assert_not_equal "$value1" "$value2"
}

@test "assert_regex: variable matches pattern" {
    version="v1.2.3"
    assert_regex "$version" "^v[0-9]+\.[0-9]+\.[0-9]+$"
}

# -----------------------------------------------------------------------------
# Working with Commands
# -----------------------------------------------------------------------------

@test "capture stdout and stderr separately" {
    run bash -c "echo 'stdout message'; echo 'stderr message' >&2"
    # $output contains both stdout and stderr by default
    assert_output --partial "stdout message"
    assert_output --partial "stderr message"
}

@test "check command exists" {
    run command -v bash
    assert_success
}

@test "working with JSON output (using grep)" {
    run echo '{"status": "ok", "count": 5}'
    assert_output --partial '"status": "ok"'
}

# -----------------------------------------------------------------------------
# Skipping Tests
# -----------------------------------------------------------------------------

@test "skip: conditionally skip a test" {
    if [[ -z "${RUN_SLOW_TESTS:-}" ]]; then
        skip "RUN_SLOW_TESTS not set"
    fi
    # This would be a slow test...
    run sleep 0.1
    assert_success
}

@test "skip based on environment" {
    [[ -n "${CI:-}" ]] || skip "Only runs in CI"
    run echo "running in CI"
    assert_success
}
