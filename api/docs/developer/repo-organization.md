# Repository Organization

This document describes the high-level architecture of the Unraid API repository.

## Overview

The repository consists of:

- API Server (NestJS)
- Redux Store
- Core Modules
- Tests

## API Server Architecture

The API server is built with NestJS and provides the core functionality for interacting with Unraid systems.

### Key Components

- `src/unraid-api/` - Core NestJS implementation
- `src/core/` - Legacy business logic and utilities
- `src/store/` - Redux store and state management
- `src/common/` - Shared utilities and types

## Redux Store

The store manages application state through several modules:

### Store Modules

- `config` - User settings, authentication, and API configuration
- `emhttp` - Unraid system and array state
- `registration` - License management
- `cache` - Application caching
- `docker` - Container management
- `upnp` - UPnP functionality
- `dynamix` - Plugin state
- `minigraph` - Mothership connectivity
- `notifications` - System notifications

### Store Listeners

Key listeners that handle side effects:

- Array state changes
- Configuration updates
- Remote access changes
- Server state updates
- UPnP changes
- WAN access changes

### Store Synchronization

The store syncs data in two ways:

- Flash Storage - Persistent configuration
- Memory Storage - Runtime state

## Project Structure

The repository is organized into several packages:

- `api/` - NestJS API server
- `plugin/` - Unraid plugin package
- `web/` - Frontend application
- `unraid-ui/` - Shared UI components

## Development Flow

New development should focus on the NestJS implementation in `src/unraid-api/`:

1. Create new features in `src/unraid-api/` using NestJS patterns
2. Use dependency injection and NestJS modules
3. Legacy code in `src/core/` should be gradually migrated
4. State management still uses Redux store when needed

## Best Practices

1. Follow NestJS architectural patterns
2. Use TypeScript decorators and strong typing
3. Implement proper dependency injection
4. Write unit tests for new services
