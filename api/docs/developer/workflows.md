# Unraid API Development Workflows

This document outlines the various workflow styles available for developing, building, and deploying the Unraid API monorepo.

## Repository Structure

The Unraid API monorepo consists of several packages:

- `api`: The Unraid API backend
- `web`: The web frontend components
- `plugin`: The Unraid plugin
- `unraid-ui`: UI components library

## Development Workflows

### Local Development

To start all development servers in the monorepo:

```bash
pnpm dev
```

This command runs all development servers concurrently:

- API server: <http://localhost:3001>
- Web components: <http://localhost:4321>
- UI components: <http://localhost:5173>

### Package-Specific Development

If you want to work on a specific package, you can run its development server individually:

#### API Development

```bash
cd api
pnpm dev
```

#### Web Development

```bash
cd web
pnpm dev
```

#### UI Component Development

```bash
cd unraid-ui
pnpm dev
```

## Building Workflows

### Building All Packages

To build all packages in the monorepo:

```bash
pnpm build
```

### Watch Mode Building

For continuous building during development:

```bash
pnpm build:watch
```

This is useful when you want to see your changes reflected without manually rebuilding. This will also allow you to install a local plugin to test your changes.

### Package-Specific Building

#### API Building

```bash
cd api
pnpm build
```

#### Web Building

```bash
cd web
pnpm build
```

#### Development Build for Web

```bash
cd web
pnpm build:dev
```

## Deployment Workflows

### Deploying to Development Unraid Server

To deploy to a development Unraid server:

```bash
pnpm unraid:deploy <SERVER_IP>
```

This command builds and deploys all components to the specified Unraid server.

### Package-Specific Deployment

#### API Deployment

```bash
cd api
pnpm unraid:deploy <SERVER_IP>
```

#### Web Deployment

```bash
cd web
pnpm unraid:deploy <SERVER_IP>
```

#### Plugin Deployment

```bash
cd plugin
pnpm unraid:deploy <SERVER_IP>
```

## Testing

To run tests across all packages:

```bash
pnpm test
```

### Package-Specific Testing

```bash
cd <package-directory>
pnpm test
```

## Code Quality Workflows

### Linting

To lint all packages:

```bash
pnpm lint
```

To automatically fix linting issues:

```bash
pnpm lint:fix
```

### Type Checking

To run type checking across all packages:

```bash
pnpm type-check
```

## GraphQL Codegen Workflows

For packages that use GraphQL, you can generate types from your schema:

```bash
cd <package-directory>
pnpm codegen
```

To watch for changes and regenerate types:

```bash
cd <package-directory>
pnpm codegen:watch
```

## Docker Workflows

The API package supports Docker-based development:

```bash
cd api
pnpm container:build    # Build the Docker container
pnpm container:start    # Start the container
pnpm container:stop     # Stop the container
pnpm container:enter    # Enter the container shell
pnpm container:test     # Run tests in the container
```

## CLI Commands

When working with a deployed Unraid API, you can use the CLI:

```bash
unraid-api --help
```

## Recommended Workflow for New Developers

1. Clone the repository: `git clone git@github.com:unraid/api.git`
2. Set up the monorepo: `just setup` or `pnpm install`
3. Start development servers: `pnpm dev`
4. Make your changes
5. Test your changes: `pnpm test`
6. Deploy to a development server: `pnpm unraid:deploy <SERVER_IP>`
7. Verify your changes on the Unraid server

If using nix, run `nix develop` from the root of the repo before Step 2.
