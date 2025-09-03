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

## Running Tests

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
pnpm --filter @unraid/e2e test auth.spec.ts

# Run tests against different server
UNRAID_URL=http://192.168.1.100 pnpm test:e2e
```

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

## Debugging

- Screenshots on failure: `test-results/`
- Videos: `test-results/` (on failure)
- Traces: `test-results/` (on retry)
- HTML Report: `pnpm --filter @unraid/e2e test:report`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| UNRAID_URL | Unraid server URL | http://tower.local |
| UNRAID_USERNAME | Username for auth | root |
| UNRAID_PASSWORD | Password for auth | - |
| HEADLESS | Run in headless mode | true |
| SLOW_MO | Slow down actions (ms) | 0 |
| DEBUG | Enable debug mode | false |