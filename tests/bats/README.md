# BATS Integration Tests

This directory contains BATS (Bash Automated Testing System) integration tests for the unraid-api.

## Prerequisites

- BATS installed (via `pnpm install`)
- SSH access to target Unraid server as root
- unraid-api deployed on target server

## Running Tests

```bash
# Run all tests
SERVER=tower pnpm test:bats

# Run integration tests only
SERVER=tower pnpm test:bats:integration

# Run a specific test file
SERVER=tower pnpm exec bats tests/bats/integration/singleton.bats

# Run tests matching a pattern
SERVER=tower pnpm exec bats tests/bats/ --filter "start:"
```

## Adding New Tests

1. Create a new `.bats` file in the appropriate directory:
   - `integration/` - Tests requiring remote server

2. Load the common helpers in setup:
   ```bash
   setup_file() {
       load '../test_helper/common'
   }

   setup() {
       load '../test_helper/common'
       # your per-test setup
   }
   ```

3. Write tests using bats-assert functions:
   ```bash
   @test "example test" {
       run my_command
       assert_success
       assert_output --partial "expected text"
   }
   ```

## Available Assertions (bats-assert)

| Assertion | Description |
|-----------|-------------|
| `assert_success` | Command exited with status 0 |
| `assert_failure` | Command exited with non-zero status |
| `assert_output "text"` | Check exact output |
| `assert_output --partial "text"` | Check output contains text |
| `assert_output --regexp "pattern"` | Check output matches regex |
| `assert_line "text"` | Check specific line in output |
| `assert_line --index 0 "text"` | Check line at index |
| `refute_output "text"` | Assert output does NOT contain text |
| `assert_regex "$var" "pattern"` | Assert variable matches regex |

## Helper Functions (common.bash)

### SSH Execution
| Function | Description |
|----------|-------------|
| `remote_exec <cmd>` | Execute command on remote server |
| `remote_exec_safe <cmd>` | Execute, ignoring failures |

### Process Management
| Function | Description |
|----------|-------------|
| `start_api` | Start the API and wait for ready |
| `stop_api [--force]` | Stop the API |
| `cleanup` | Kill all API processes |
| `get_remote_pid` | Get PID from remote PID file |
| `pid_file_exists` | Check if PID file exists |
| `is_process_running <pid>` | Check if process is running |

### Assertions
| Function | Description |
|----------|-------------|
| `assert_single_api_instance` | Verify exactly one API running |
| `assert_no_api_processes` | Verify no API processes |

### Wait Helpers
| Function | Description |
|----------|-------------|
| `wait_for_start [timeout]` | Wait for API to start |
| `wait_for_stop [timeout]` | Wait for API to stop |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SERVER` | Yes | SSH server name or IP address |
| `DEFAULT_TIMEOUT` | No | Test timeout in seconds (default: 10) |

## Directory Structure

```
tests/bats/
├── test_helper/
│   ├── common.bash        # Shared helper functions
│   ├── bats-support/      # Symlink to node_modules
│   └── bats-assert/       # Symlink to node_modules
├── integration/
│   └── singleton.bats     # Singleton process tests
└── README.md              # This file
```
