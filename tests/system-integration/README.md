# System Integration Tests

TypeScript + Vitest integration tests for the unraid-api daemon process management. These tests validate singleton daemon behavior by executing commands on a remote Unraid server via SSH.

## Prerequisites

- Node.js 22+
- pnpm
- SSH key-based authentication to the target Unraid server
- The target server must have `unraid-api` installed and accessible

## Installation

```bash
cd tests/system-integration
pnpm install
```

Or from the monorepo root:

```bash
pnpm install
```

## Usage

### Running Tests

Tests require the `SERVER` environment variable to specify the target Unraid server:

```bash
# Run all tests
SERVER=tower pnpm test

# Run tests in watch mode
SERVER=tower pnpm test:watch

# From monorepo root
SERVER=tower pnpm test:system
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SERVER` | Yes | Hostname or IP address of the target Unraid server |

## Test Coverage

The test suite validates daemon singleton process management:

### Start Command Tests
- Creates a single process with PID file
- Second start does not create duplicate process
- Cleans up stale PID file
- Cleans up orphaned nodemon process

### Status Command Tests
- Reports running when API is active
- Reports not running when API is stopped

### Stop Command Tests
- Cleanly terminates all processes
- Force stop terminates all processes immediately

### Restart Command Tests
- Creates new process when already running
- Works when API is not running

### Edge Case Tests
- Concurrent starts result in single process
- API recovers after process is killed externally

## Architecture

### Process Model

The unraid-api runs as a singleton daemon with two processes:

```
nodemon (supervisor)
└── node dist/main.js (worker)
```

- **nodemon**: Process supervisor that monitors and restarts the main process
- **main.js**: The actual API server

### PID File

The daemon tracks its process via a PID file:
```
/var/run/unraid-api/nodemon.pid
```

## Project Structure

```
tests/system-integration/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
└── src/
    ├── helpers/
    │   ├── ssh.ts            # SSH execution via execa
    │   ├── process.ts        # Process query/assertion helpers
    │   └── api-lifecycle.ts  # Start/stop/cleanup helpers
    └── tests/
        └── singleton-daemon.test.ts
```

### Helper Modules

#### `ssh.ts`
Remote command execution via SSH:
- `remoteExec(cmd)` - Execute command, return result
- `remoteExecSafe(cmd)` - Execute command, ignore failures (for cleanup)

#### `process.ts`
Process inspection and assertions:
- `getRemotePid()` - Read PID from file
- `pidFileExists()` - Check PID file existence
- `isProcessRunning(pid)` - Verify process is alive
- `countNodemonProcesses()` - Count nodemon instances
- `countMainProcesses()` - Count main.js workers
- `assertSingleApiInstance()` - Assert exactly 1 nodemon + 1 main.js
- `assertNoApiProcesses()` - Assert all processes stopped

#### `api-lifecycle.ts`
High-level daemon management:
- `startApi()` - Start and wait for ready
- `stopApi(force?)` - Stop with optional force flag
- `cleanup()` - Multi-step process cleanup
- `waitForStart(timeout)` - Poll until started
- `waitForStop(timeout)` - Poll until stopped
- `getStatus()` - Get status output

## Configuration

### Vitest Configuration

The tests run sequentially (not in parallel) since they interact with shared server state:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    testTimeout: 60000,    // SSH operations can be slow
    hookTimeout: 60000,
    sequence: {
      concurrent: false,   // Run tests sequentially
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,  // Single process for all tests
      },
    },
  },
});
```

### SSH Configuration

SSH connections use these options:
- `ConnectTimeout=10` - 10 second connection timeout
- `BatchMode=yes` - Disable password prompts (requires key auth)
- `StrictHostKeyChecking=accept-new` - Auto-accept new host keys

## Comparison with BATS Tests

This package is a TypeScript port of the BATS test suite in `tests/bats/`. Key differences:

| Feature | BATS | TypeScript/Vitest |
|---------|------|-------------------|
| Language | Bash | TypeScript |
| Test Runner | bats-core | Vitest |
| Assertions | bats-assert | Vitest expect() |
| SSH Execution | Raw ssh command | execa |
| Async Model | Synchronous shell | Async/await |
| Type Safety | None | Full TypeScript types |

## Troubleshooting

### SSH Connection Fails

Ensure SSH key authentication is configured:

```bash
# Test SSH connection
ssh root@tower echo "Connected"

# If prompted for password, set up key auth:
ssh-copy-id root@tower
```

### Tests Time Out

Increase timeouts in `vitest.config.ts` or individual tests:

```typescript
it('slow test', async () => {
  // ...
}, 120000); // 2 minute timeout
```

### Processes Not Cleaned Up

If tests fail and leave processes running, manually clean up:

```bash
ssh root@tower 'unraid-api stop --force; pkill -f nodemon; pkill -f main.js'
```
