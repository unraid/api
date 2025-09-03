---
title: Programmatic API Key Management
description: Create, use, and delete API keys programmatically for automated workflows
sidebar_position: 4
---

# Programmatic API Key Management

This guide explains how to create, use, and delete API keys programmatically using the Unraid API CLI, enabling automated workflows and scripts.

## Overview

The `unraid-api apikey` command supports both interactive and non-interactive modes, making it suitable for:

- Automated deployment scripts
- CI/CD pipelines
- Temporary access provisioning
- Infrastructure as code workflows

:::tip[Quick Start]
Jump to the [Complete Workflow Example](#complete-workflow-example) to see everything in action.
:::

## Creating API Keys Programmatically

### Basic Creation with JSON Output

Use the `--json` flag to get machine-readable output:

```bash
unraid-api apikey --create --name "workflow key" --roles ADMIN --json
```

**Output:**

```json
{
    "key": "your-generated-api-key-here",
    "name": "workflow key",
    "id": "generated-uuid"
}
```

### Advanced Creation with Permissions

```bash
unraid-api apikey --create \
  --name "limited access key" \
  --permissions "DOCKER:READ_ANY,ARRAY:READ_ANY" \
  --description "Read-only access for monitoring" \
  --json
```

### Handling Existing Keys

If a key with the same name exists, use `--overwrite`:

```bash
unraid-api apikey --create --name "existing key" --roles ADMIN --overwrite --json
```

:::warning[Key Replacement]
The `--overwrite` flag will permanently replace the existing key. The old key will be immediately invalidated.
:::

## Deleting API Keys Programmatically

### Non-Interactive Deletion

Delete a key by name without prompts:

```bash
unraid-api apikey --delete --name "workflow key"
```

**Output:**

```
Successfully deleted 1 API key
```

### JSON Output for Deletion

Use `--json` flag for machine-readable delete confirmation:

```bash
unraid-api apikey --delete --name "workflow key" --json
```

**Success Output:**

```json
{
    "deleted": 1,
    "keys": [
        {
            "id": "generated-uuid",
            "name": "workflow key"
        }
    ]
}
```

**Error Output:**

```json
{
    "deleted": 0,
    "error": "No API key found with name: nonexistent key"
}
```

### Error Handling

When the specified key doesn't exist:

```bash
unraid-api apikey --delete --name "nonexistent key"
# Output: No API keys found to delete
```

**JSON Error Output:**

```json
{
    "deleted": 0,
    "message": "No API keys found to delete"
}
```

## Complete Workflow Example

Here's a complete example for temporary access provisioning:

```bash
#!/bin/bash
set -e

# 1. Create temporary API key
echo "Creating temporary API key..."
KEY_DATA=$(unraid-api apikey --create \
  --name "temp deployment key" \
  --roles ADMIN \
  --description "Temporary key for deployment $(date)" \
  --json)

# 2. Extract the API key
API_KEY=$(echo "$KEY_DATA" | jq -r '.key')
echo "API key created successfully"

# 3. Use the key for operations
echo "Configuring services..."
curl -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"provider": "azure", "clientId": "your-client-id"}' \
  http://localhost:3001/graphql

# 4. Clean up (always runs, even on error)
trap 'echo "Cleaning up..."; unraid-api apikey --delete --name "temp deployment key"' EXIT

echo "Deployment completed successfully"
```

## Command Reference

### Create Command Options

| Flag                    | Description             | Example                           |
| ----------------------- | ----------------------- | --------------------------------- |
| `--name <name>`         | Key name (required)     | `--name "my key"`                 |
| `--roles <roles>`       | Comma-separated roles   | `--roles ADMIN,VIEWER`            |
| `--permissions <perms>` | Resource:action pairs   | `--permissions "DOCKER:READ_ANY"` |
| `--description <desc>`  | Key description         | `--description "CI/CD key"`       |
| `--overwrite`           | Replace existing key    | `--overwrite`                     |
| `--json`                | Machine-readable output | `--json`                          |

### Available Roles

- `ADMIN` - Full system access
- `CONNECT` - Unraid Connect features
- `VIEWER` - Read-only access
- `GUEST` - Limited access

### Available Resources and Actions

**Resources:** `ACTIVATION_CODE`, `API_KEY`, `ARRAY`, `CLOUD`, `CONFIG`, `CONNECT`, `CONNECT__REMOTE_ACCESS`, `CUSTOMIZATIONS`, `DASHBOARD`, `DISK`, `DISPLAY`, `DOCKER`, `FLASH`, `INFO`, `LOGS`, `ME`, `NETWORK`, `NOTIFICATIONS`, `ONLINE`, `OS`, `OWNER`, `PERMISSION`, `REGISTRATION`, `SERVERS`, `SERVICES`, `SHARE`, `VARS`, `VMS`, `WELCOME`

**Actions:** `CREATE_ANY`, `CREATE_OWN`, `READ_ANY`, `READ_OWN`, `UPDATE_ANY`, `UPDATE_OWN`, `DELETE_ANY`, `DELETE_OWN`

### Delete Command Options

| Flag            | Description              | Example           |
| --------------- | ------------------------ | ----------------- |
| `--delete`      | Enable delete mode       | `--delete`        |
| `--name <name>` | Key to delete (optional) | `--name "my key"` |

**Note:** If `--name` is omitted, the command runs interactively.

## Best Practices

:::info[Security Best Practices]
**Minimal Permissions**

- Use specific permissions instead of ADMIN role when possible
- Example: `--permissions "DOCKER:READ_ANY"` instead of `--roles ADMIN`

**Key Lifecycle Management**

- Always clean up temporary keys after use
- Store API keys securely (environment variables, secrets management)
- Use descriptive names and descriptions for audit trails
  :::

### Error Handling

- Check exit codes (`$?`) after each command
- Use `set -e` in bash scripts to fail fast
- Implement proper cleanup with `trap`

### Key Naming

- Use descriptive names that include purpose and date
- Names must contain only letters, numbers, and spaces
- Unicode letters are supported

## Troubleshooting

### Common Issues

:::note[Common Error Messages]

**"API key name must contain only letters, numbers, and spaces"**

- **Solution:** Remove special characters like hyphens, underscores, or symbols

**"API key with name 'x' already exists"**

- **Solution:** Use `--overwrite` flag or choose a different name

**"Please add at least one role or permission to the key"**

- **Solution:** Specify either `--roles` or `--permissions` (or both)

:::

### Debug Mode

For troubleshooting, run with debug logging:

```bash
LOG_LEVEL=debug unraid-api apikey --create --name "debug key" --roles ADMIN
```
