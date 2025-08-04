# Development Configuration Files

This directory contains configuration files for local development.

## OIDC Configuration

### oidc.json
The default OIDC configuration file. This file is committed to git and should only contain non-sensitive test configurations.

### Using a Local Configuration (gitignored)
For local testing with real OAuth providers:

1. Create an `oidc.local.json` file based on `oidc.local.example.json`
2. Add it to your local `.gitignore` to prevent committing secrets
3. Set the environment variable: `PATHS_OIDC_JSON=oidc.local.json`
4. The API will load your local configuration instead of the default

Example:
```bash
PATHS_OIDC_JSON=oidc.local.json pnpm dev
```

### Setting up OAuth Apps

#### Google
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/graphql/api/auth/oidc/callback`

#### GitHub
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/graphql/api/auth/oidc/callback`