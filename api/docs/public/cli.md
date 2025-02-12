# CLI Commands

### Start

```bash
unraid-api start [--log-level <level>]
```

Starts the Unraid API service.

Options:
- `--log-level`: Set logging level (trace|debug|info|warn|error)

### Stop

```bash
unraid-api stop [--delete]
```

Stops the Unraid API service.

- `--delete`: Optional. Delete the PM2 home directory

### Restart

```bash
unraid-api restart
```

Restarts the Unraid API service.

### Logs

```bash
unraid-api logs [-l <lines>]
```

View the API logs.

- `-l, --lines`: Optional. Number of lines to tail (default: 100)

## Configuration Commands

### Config

```bash
unraid-api config
```

Displays current configuration values.

### Switch Environment

```bash
unraid-api switch-env [-e <environment>]
```

Switch between production and staging environments.

- `-e, --environment`: Optional. Target environment (production|staging)

### Developer Mode

```bash
unraid-api developer
```

Configure developer features for the API (e.g., GraphQL sandbox).

## API Key Management

### API Key Commands

```bash
unraid-api apikey [options]
```

Create and manage API keys.

Options:

- `--name <name>`: Name of the key
- `--create`: Create a new key
- `-r, --roles <roles>`: Comma-separated list of roles
- `-p, --permissions <permissions>`: Comma-separated list of permissions
- `-d, --description <description>`: Description for the key

## SSO (Single Sign-On) Management

### SSO Base Command

```bash
unraid-api sso
```

#### Add SSO User

```bash
unraid-api sso add-user
# or
unraid-api sso add
# or
unraid-api sso a
```

Add a new user for SSO authentication.

#### Remove SSO User

```bash
unraid-api sso remove-user
# or
unraid-api sso remove
# or
unraid-api sso r
```

Remove a user (or all users) from SSO.

#### List SSO Users

```bash
unraid-api sso list-users
# or
unraid-api sso list
# or
unraid-api sso l
```

List all configured SSO users.

#### Validate SSO Token

```bash
unraid-api sso validate-token <token>
# or
unraid-api sso validate
# or
unraid-api sso v
```

Validates an SSO token and returns its status.

## Report Generation

### Generate Report

```bash
unraid-api report [-r] [-j]
```

Generate a system report.

- `-r, --raw`: Display raw command output
- `-j, --json`: Display output in JSON format

## Notes

1. Most commands require appropriate permissions to modify system state
2. Some commands require the API to be running or stopped
3. Store API keys securely as they provide system access
4. SSO configuration changes may require a service restart
