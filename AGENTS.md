# AGENTS.md

This file provides architectural guidance and coding standards for AI agents
interacting with this repository."

## Project Overview

This is the Unraid API monorepo containing multiple packages that provide API functionality for Unraid servers. It uses pnpm workspaces with the following structure:

- `/api` - Core NestJS API server with GraphQL
- `/web` - Vue 3 frontend application
- `/unraid-ui` - Vue 3 component library
- `/plugin` - Unraid plugin package (.plg)
- `/packages` - Shared packages and API plugins

## Essential Commands

### Development

```bash
pnpm install              # Install all dependencies
pnpm dev                  # Run all dev servers concurrently
pnpm build                # Build all packages
pnpm build:watch          # Watch mode with local plugin build
```

### Testing & Code Quality

```bash
pnpm test                 # Run all tests
pnpm lint                 # Run linting
pnpm lint:fix             # Fix linting issues
pnpm type-check           # TypeScript type checking
```

### API Development

```bash
cd api && pnpm dev        # Run API server (http://localhost:3001)
cd api && pnpm test:watch # Run tests in watch mode
cd api && pnpm codegen    # Generate GraphQL types
```

### Deployment

```bash
pnpm unraid:deploy <SERVER_IP>  # Deploy all to Unraid server
```

### Developer Tools

```bash
unraid-api developer                       # Interactive prompt for tools
unraid-api developer --sandbox true        # Enable GraphQL sandbox
unraid-api developer --sandbox false       # Disable GraphQL sandbox
unraid-api developer --enable-modal        # Enable modal testing tool
unraid-api developer --disable-modal       # Disable modal testing tool
```

## Architecture Notes

### API Structure (NestJS)

- Modules: `auth`, `config`, `plugins`, `emhttp`, `monitoring`
- GraphQL API with Apollo Server at `/graphql`
- Redux store for state management in `src/store/`
- Plugin system for extending functionality
- Entry points: `src/index.ts` (server), `src/cli.ts` (CLI)

### Key Patterns

- TypeScript imports use `.js` extensions (ESM compatibility)
- NestJS dependency injection with decorators
- GraphQL schema-first approach with code generation
- API plugins follow specific structure (see `api/docs/developer/api-plugins.md`)

### Authentication

- API key authentication via headers
- Cookie-based session management
- Keys stored in `/boot/config/plugins/unraid-api/`

### Development Workflow

1. Work Intent required before starting development
2. Fork from `main` branch
3. Reference Work Intent in PR
4. No direct pushes to main

### Debug Mode

```bash
LOG_LEVEL=debug unraid-api start --debug
```

Enables GraphQL playground at `http://tower.local/graphql`

## Coding Guidelines

### General Rules

- Never add comments unless they are needed for clarity of function
- Never add comments for obvious things, and avoid commenting when starting and ending code blocks
- Be CONCISE, keep replies shorter than a paragraph if at all possible

### API Development Rules (`api/**/*`)

- Use pnpm ONLY for package management
- Always run scripts from api/package.json unless requested
- Prefer adding new files to the NestJS repo located at `api/src/unraid-api/` instead of the legacy code
- Test suite is VITEST, do not use jest
- Run tests with: `pnpm --filter ./api test`
- Prefer to not mock simple dependencies

### Web Development Rules (`web/**/*`)

- Always run `pnpm codegen` for GraphQL code generation in the web directory
- GraphQL queries must be placed in `.query.ts` files
- GraphQL mutations must be placed in `.mutation.ts` files
- All GraphQL under `web/` must follow this naming convention

### Testing Guidelines

#### General Testing Best Practices

- **Error Testing:** Use `.rejects.toThrow()` without arguments to test that functions throw errors. Don't test exact error message strings unless the message format is specifically what you're testing
- **Focus on Behavior:** Test what the code does, not implementation details like exact error message wording
- **Avoid Brittleness:** Don't write tests that break when minor changes are made to error messages, log formats, or other non-essential details
- **Use Mocks Correctly**: Mocks should be used as nouns, not verbs.

#### Vue Component Testing
- Use pnpm when running terminal commands and stay within the web directory
- Tests are located under `web/__test__`, run with `pnpm test`
- Use `mount` from Vue Test Utils for component testing
- Stub complex child components that aren't the focus of the test
- Mock external dependencies and services
- Test component behavior and output, not implementation details
- Use `createTestingPinia()` for mocking stores in components
- Find elements with semantic queries like `find('button')` rather than data-test IDs
- Use `await nextTick()` for DOM updates
- Always await async operations before making assertions

#### Store Testing with Pinia

- Use `createPinia()` and `setActivePinia` when testing Store files
- Only use `createTestingPinia` if you specifically need its testing features
- Let stores initialize with their natural default state
- Don't mock the store being tested
- Ensure Vue reactivity imports are added to store files (computed, ref, watchEffect)
- Place all mock declarations at the top level
- Use factory functions for module mocks to avoid hoisting issues
- Clear mocks between tests to ensure isolation

## Development Memories

- We are using tailwind v4 we do not need a tailwind config anymore 
- always search the internet for tailwind v4 documentation when making tailwind related style changes
- never run or restart the API server or web server. I will handle the lifecycle, simply wait and ask me to do this for you
- Never use the `any` type. Always prefer proper typing
- Avoid using casting whenever possible, prefer proper typing from the start
- **IMPORTANT:** cache-manager v7 expects TTL values in **milliseconds**, not seconds. Always use milliseconds when setting cache TTL (e.g., 600000 for 10 minutes, not 600)
