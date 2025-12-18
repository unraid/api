# Unraid Plugin Builder

Tool for building and testing Unraid plugins locally as well as packaging them for deployment.

## Development Workflow

### 1. Build the Plugin

> **Note:** Building the plugin requires Docker.

Once your changes are ready, build the plugin package:

```bash
# Start Docker container (builds dependencies automatically)
pnpm run docker:build-and-run

# Inside the container, build the plugin
pnpm build
```

This will:

1. Build the API release (`api/deploy/release/`)
2. Build the web standalone components (`web/dist/`)
3. Start Docker container with HTTP server on port 5858
4. Build the plugin package (when you run `pnpm build`)

The plugin files will be created in `./deploy/` and served automatically.

### 2. Install on Unraid

Install the plugin on your Unraid development machine by visiting:

`http://SERVER_NAME.local/Plugins`

Then paste the following URL into the Unraid Plugins page:

`http://YOUR_LOCAL_DEV_MACHINE_IP:5858/plugins/local/dynamix.unraid.net.plg`

Replace `SERVER_NAME` with your development machine's hostname.

## Development Tips

- The HTTP server includes CORS headers for local development
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

- `build` - Build the plugin package (run inside Docker container)
- `docker:build` - Build the Docker container
- `docker:run` - Run the builder in Docker
- `docker:build-and-run` - Build dependencies and start Docker container

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
