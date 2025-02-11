# Unraid Plugin Builder

Tool for building and testing Unraid plugins locally as well as packaging them for deployment.

## Development Workflow

### 1. Watch for Changes

The watch command will automatically sync changes from the API, UI components, and web app into the plugin source:

```bash
# Start watching all components
pnpm run watch:all

# Or run individual watchers:
pnpm run api:watch    # Watch API changes
pnpm run ui:watch     # Watch Unraid UI component changes
pnpm run wc:watch     # Watch web component changes
```

This will copy:

- API files to `./source/dynamix.unraid.net/usr/local/unraid-api`
- UI components to `./source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components`
- Web components to the same UI directory

### 2. Build the Plugin

Once your changes are ready, build the plugin package:

```bash
# Build using Docker - on non-Linux systems
pnpm run docker:build-and-run

# Or build with the build script
pnpm run build:validate
```

This will create the plugin files in `./deploy/release/`

### 3. Serve and Install

Start a local HTTP server to serve the plugin files:

```bash
# Serve the plugin files
pnpm run http-server
```

Then install the plugin on your Unraid development machine by visiting:

`http://SERVER_NAME.local/Plugins`

Then paste the following URL into the Unraid Plugins page:

`http://YOUR_LOCAL_DEV_MACHINE_IP:8080/plugins/local/dynamix.unraid.net.plg`

Replace `SERVER_NAME` with your development machine's hostname.

## Development Tips

- Run watchers in a separate terminal while developing
- The http-server includes CORS headers for local development
- Check the Unraid system log for plugin installation issues

## Environment Setup

1. Initialize environment:

    ```bash
    pnpm run env:init
    ```

2. Validate environment:

    ```bash
    pnpm run env:validate
    ```

## Available Commands

### Build Commands

- `build` - Build the plugin package
- `build:validate` - Build with environment validation
- `docker:build` - Build the Docker container
- `docker:run` - Run the builder in Docker
- `docker:build-and-run` - Build and run in Docker

### Watch Commands

- `watch:all` - Watch all component changes
- `api:watch` - Watch API changes
- `ui:watch` - Watch UI component changes
- `wc:watch` - Watch web component changes

### Server Commands

- `http-server` - Serve the plugin files locally

### Environment Commands

- `env:init` - Create initial .env file
- `env:validate` - Validate environment setup
- `env:clean` - Remove .env file

## Troubleshooting

1. **Watch not updating files**

   - Check that source directories exist
   - Verify file permissions

2. **Build failures**

   - Ensure .env file exists
   - Check Docker setup if using containerized build
   - Verify source files are present

3. **Installation issues**
   - Confirm http-server is running
   - Check your local IP is correct
   - Verify plugin file permissions
