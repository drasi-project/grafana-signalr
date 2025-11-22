# E2E Tests for Drasi SignalR Datasource

This directory contains Playwright end-to-end tests for the Drasi SignalR Grafana datasource plugin.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Grafana running (either via `npm run server` or manually)

## Running Tests

### Install Playwright Browsers

First time only, install Playwright browsers:

```bash
npx playwright install
```

### Run All Tests

```bash
npm run e2e
```

### Run Tests in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run Specific Test File

```bash
npx playwright test tests/smoke.spec.ts
```

### Debug Tests

```bash
npx playwright test --debug
```

### Update Screenshots

```bash
npm run e2e:update
```

## Test Structure

- **smoke.spec.ts** - Basic smoke tests to verify Grafana loads and authentication works
- **datasource.spec.ts** - Comprehensive tests for the Drasi SignalR datasource functionality

## Test Configuration

The tests are configured in `playwright.config.ts` with the following defaults:

- **Base URL**: `http://localhost:3002` (Grafana instance)
- **Workers**: 1 (sequential execution)
- **Retries**: 2 (in CI only)
- **Timeout**: 30 seconds per test
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure

## Writing Tests

### Authentication

All tests should use the `loginToGrafana` helper function:

```typescript
import { loginToGrafana } from './smoke.spec';

test('my test', async ({ page }) => {
  await loginToGrafana(page);
  // Your test code
});
```

### Default Credentials

- **Username**: admin
- **Password**: admin

## CI/CD Integration

The tests will automatically:
- Start Grafana via docker-compose if not already running
- Retry failed tests twice
- Generate HTML reports in `playwright-report/`
- Capture screenshots and videos on failure

## Troubleshooting

### Tests timeout

Increase the timeout in specific tests:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

### Grafana not starting

Ensure docker-compose is working:

```bash
npm run server
```

Then run tests with existing server:

```bash
npx playwright test --grep "smoke"
```

### Debugging selector issues

Use Playwright Inspector:

```bash
npx playwright test --debug
```

Or generate selectors:

```bash
npx playwright codegen http://localhost:3002
```
