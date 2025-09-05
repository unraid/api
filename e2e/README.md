# Unraid WebGUI E2E Tests

End-to-end tests for Unraid WebGUI using Playwright.

## Setup

1. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   pnpm install
   pnpm playwright:install
   ```

3. Configure your Unraid server URL in `.env`:
   ```
   UNRAID_URL=http://tower.local
   UNRAID_USERNAME=root
   UNRAID_PASSWORD=your_password
   ```

## Creating Test Profiles

To test against multiple Unraid servers or configurations, create additional environment files:

1. Copy `.env.example` to create new profiles:
   ```bash
   cp .env.example .env.test-server
   cp .env.example .env.dev-server-2
   cp .env.example .env.staging
   ```

2. Configure each profile with different server details:
   ```bash
   # .env.test-server
   UNRAID_URL=https://test.example.com
   UNRAID_USERNAME=root
   UNRAID_PASSWORD=test_password

   # .env.dev-server-2  
   UNRAID_URL=http://192.168.1.50
   UNRAID_USERNAME=admin
   UNRAID_PASSWORD=dev_password
   ```

You can then run tests against specific profiles using dotenvx or the justfile recipes (see below).

## Running Tests

By default, `pnpm test` commands will read environment variables from `.env`.

Use `dotenvx` as shown below to override.

```bash
# Run all tests
pnpm test

# Run tests in headed mode (see browser)
pnpm test:headed

# Debug tests interactively
pnpm test:debug

# Open Playwright UI
pnpm test:ui

# Run specific test file
pnpm test auth.spec.ts

# Run tests against different server
UNRAID_URL=http://192.168.1.100 pnpm test:e2e

# Run tests against different "profiles"
# -> Make sure not to track your profiles in git
dotenvx run -f .env.dev-server-2 -- pnpm test
```

## Justfile Usage

This project includes a `justfile` for advanced testing workflows. Install [just](https://github.com/casey/just) if you haven't already.

### Quick Start

```bash
# Install dependencies (including dotenvx if not present)
just install

# List available commands
just

# List your environment profiles
just list-envs
```

### Running Tests with Profiles

```bash
# Run tests against a specific environment file
just test-env .env.production-server

# Run tests against a specific environment with additional args
just test-env .env.dev-server-2 --grep "login"

# Run tests against ALL environment files (excludes .env.example)
just test-all-envs

# Run tests against all environments with specific test pattern
just test-all-envs --grep "dashboard"
```

### Headed Mode Testing

```bash
# Run tests in headed mode for debugging
just test-env-headed .env.staging

# Run headed tests with specific browser
just test-env-headed .env.local --project=chromium
```

### Managing Results

```bash
# View report for a specific environment
just show-report production-server

# Clean all test artifacts and reports
just clean
```

### Use Cases

- **Multi-environment validation**: Test the same suite against development, staging, and production servers
- **Configuration testing**: Validate behavior across different Unraid configurations (different plugins, versions, etc.)
- **Regression testing**: Run focused tests against specific environments when debugging issues
- **Batch testing**: Validate changes across your entire server fleet with one command

The justfile automatically organizes reports by environment (e.g., `playwright-report-production-server`) so you can easily compare results across different servers.

## Test Structure

```
e2e/
├── fixtures/        # Test fixtures and setup
├── tests/          # Test specifications
├── utils/          # Helper functions and page objects
│   ├── pages/      # Page object models
│   └── helpers.ts  # Utility functions
└── playwright.config.ts
```

## Writing Tests

### Basic Test
```typescript
import { test, expect } from '@playwright/test';

test('should load dashboard', async ({ page }) => {
  await page.goto('/Dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

### With Authentication
```typescript
import { test, expect } from '../fixtures/auth.fixture';

test('authenticated test', async ({ page, authenticatedPage }) => {
  // Already logged in
  await page.goto('/Settings');
  // ... test code
});
```

### Page Objects
```typescript
import { DashboardPage } from '../utils/pages/dashboard.page';

test('using page object', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.goto();
  await dashboard.navigateTo('Docker');
});
```

## CI/CD Integration

Tests can run in CI with:
```yaml
- name: Run E2E Tests
  env:
    UNRAID_URL: ${{ secrets.UNRAID_URL }}
    UNRAID_PASSWORD: ${{ secrets.UNRAID_PASSWORD }}
  run: pnpm test:e2e
```

## Logging

Tests automatically capture console logs and redirect them to structured log files. You don't need to import anything - just use standard console methods:

```typescript
test('example test', async ({ page }) => {
  console.log('Starting test');
  console.info('User navigated to dashboard');
  console.warn('Slow network detected');
  console.error('Authentication failed');
  
  // All logs are automatically captured with test context
});
```

### Log Files Location

Logs are organized by browser and test hierarchy:
```
test-results/logs/
├── chromium/
├── firefox/
└── mobile-chrome/
    └── test-file/
        └── test-suite/
            └── test-name/
                └── timestamp.log
```

### Log Format

Each log entry includes:
- Timestamp (millisecond precision)
- Log level (INFO, WARN, ERROR)
- Browser name
- Full test path
- Message and metadata

Example log entry:
```
[2025-09-04 15:54:14.774] [INFO] [chromium] [dashboard.spec.ts > Dashboard > should display navigation menu] Found menu item: Main
```

### Direct Logger Access

For more control, you can access the logger directly:

```typescript
test('advanced logging', async ({ logger }) => {
  logger.info('Test started');
  logger.debug('Detailed debug info', { userId: 123 });
  logger.warn('Performance issue detected', { loadTime: 5000 });
  logger.error('Critical failure', new Error('Database connection lost'));
});
```

## Debugging

- Screenshots on failure: `test-results/`
- Videos: `test-results/` (on failure)
- Traces: `test-results/` (on retry)
- **Logs: `test-results/logs/` (organized by browser/test)**
- HTML Report: `pnpm --filter @unraid/e2e test:report`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| UNRAID_URL | Unraid server URL | http://tower.local |
| UNRAID_USERNAME | Username for auth | root |
| UNRAID_PASSWORD | Password for auth | - |
| SLOW_MO | Slow down actions (ms) | 0 |
| DEBUG | Enable debug mode | false |