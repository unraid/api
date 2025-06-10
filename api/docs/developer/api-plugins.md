# Working with API plugins

Under the hood, API plugins (i.e. plugins to the `@unraid/api` project) are represented
as npm `peerDependencies`. This is npm's intended package plugin mechanism, and given that
peer dependencies are installed by default as of npm v7, it supports bi-directional plugin functionality,
where the API provides dependencies for the plugin while the plugin provides functionality to the API.

## Private Workspace plugins

### Adding a local workspace package as an API plugin

The challenge with local workspace plugins is that they aren't available via npm during production.
To solve this, we vendor them during the build process. Here's the complete process:

#### 1. Configure the build system

Add your workspace package to the vendoring configuration in `api/scripts/build.ts`:

```typescript
const WORKSPACE_PACKAGES_TO_VENDOR = {
    '@unraid/shared': 'packages/unraid-shared',
    'unraid-api-plugin-connect': 'packages/unraid-api-plugin-connect',
    'your-plugin-name': 'packages/your-plugin-path', // Add your plugin here
} as const;
```

#### 2. Configure Vite

Add your workspace package to the Vite configuration in `api/vite.config.ts`:

```typescript
const workspaceDependencies = {
    '@unraid/shared': 'packages/unraid-shared',
    'unraid-api-plugin-connect': 'packages/unraid-api-plugin-connect',
    'your-plugin-name': 'packages/your-plugin-path', // Add your plugin here
};
```

This ensures the package is:
- Excluded from Vite's optimization during development
- Marked as external during the build process
- Properly handled in SSR mode

#### 3. Configure the API package.json

Add your workspace package as a peer dependency in `api/package.json`:

```json
{
    "peerDependencies": {
        "unraid-api-plugin-connect": "workspace:*",
        "your-plugin-name": "workspace:*"
    },
    "peerDependenciesMeta": {
        "unraid-api-plugin-connect": {
            "optional": true
        },
        "your-plugin-name": {
            "optional": true
        }
    }
}
```

By marking the workspace dependency "optional", npm will not attempt to install it during development.
The "workspace:*" identifier will be invalid during build-time and run-time, but won't cause problems
because the package gets vendored instead.

#### 4. Plugin package setup

Your workspace plugin package should:

1. **Export types and main entry**: Set up proper `main`, `types`, and `exports` fields:
```json
{
    "name": "your-plugin-name",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "type": "module",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js"
        }
    },
    "files": ["dist"]
}
```

2. **Use peer dependencies**: Declare shared dependencies as peer dependencies to avoid duplication:
```json
{
    "peerDependencies": {
        "@nestjs/common": "^11.0.11",
        "@nestjs/core": "^11.0.11",
        "graphql": "^16.9.0"
    }
}
```

3. **Include build script**: Add a build script that compiles TypeScript:
```json
{
    "scripts": {
        "build": "tsc",
        "prepare": "npm run build"
    }
}
```

#### 5. Build process

During production builds:

1. The build script (`api/scripts/build.ts`) will automatically pack and install your workspace package as a tarball
2. This happens after `npm install --omit=dev` in the pack directory
3. The vendored package becomes a regular node_modules dependency in the final build

#### 6. Development vs Production

- **Development**: Vite resolves workspace packages directly from their source
- **Production**: Packages are vendored as tarballs in `node_modules`

This approach ensures that workspace plugins work seamlessly in both development and production environments.
