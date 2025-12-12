# System Integration Tests

Integration tests that run against a live Unraid server via SSH.

## Prerequisites

- SSH key-based authentication to the target Unraid server
- `unraid-api` installed on the target server

## Usage

```bash
# Run tests
SERVER=tower pnpm test

# From monorepo root
SERVER=tower pnpm test:system
```

## Troubleshooting

### SSH Connection Fails

Ensure SSH key authentication is configured:

```bash
ssh root@tower echo "Connected"

# If prompted for password:
ssh-copy-id root@tower
```

### Processes Not Cleaned Up

If tests fail and leave processes running:

```bash
ssh root@tower 'unraid-api stop --force; pkill -f nodemon; pkill -f main.js'
```
