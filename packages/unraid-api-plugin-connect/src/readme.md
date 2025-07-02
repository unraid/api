# @unraid-api-plugin-connect/src

This directory contains the core source code for the Unraid Connect API plugin, built as a modular [NestJS](https://nestjs.com/) application. It provides remote access, cloud integration, and configuration management for Unraid servers.

## Structure
- **index.ts**: Main entry, conforming to the `nestjs` API plugin schema.
- **authn/**: Authentication services.
- **config/**: Configuration management, persistence, and settings.
- **connection-status/**: Connection state monitoring and status tracking.
- **graphql/**: GraphQL request definitions and generated client code.
- **helper/**: Utility functions and constants.
- **internal-rpc/**: Internal RPC communication services.
- **mothership-proxy/**: Mothership server proxy and communication.
- **network/**: Network services including UPnP, DNS, URL resolution, and WAN access.
- **remote-access/**: Remote access services (static, dynamic, UPnP).
- **unraid-connect/**: Core Unraid Connect functionality and settings.
- **\_\_test\_\_/**: Vitest-based unit and integration tests.

Each feature directory follows a consistent pattern:
- `*.module.ts`: NestJS module definition
- `*.service.ts`: Business logic implementation
- `*.resolver.ts`: GraphQL resolvers
- `*.{model,dto}.ts`: TypeScript and GraphQL models, DTOs, and types
- `*.events.ts`: Event handlers for event-driven operations
- `*.config.ts`: Configuration definitions

## Usage
This package is intended to be used as a NestJS plugin/module. Import `ApiModule` from `index.ts` and add it to your NestJS app's module imports.

```
import { ApiModule } from '@unraid-api-plugin-connect/src';

@Module({
  imports: [ApiModule],
})
export class AppModule {}
```

## Development
- Install dependencies from the monorepo root: `pnpm install`
- Build: `pnpm run build` (from the package root)
- Codegen (GraphQL): `pnpm run codegen`
- Tests: `vitest` (see `__test__/` for examples)
- Format: `pnpm run format` to format all files in project

## Notes
- Designed for Unraid server environments.
- Relies on other Unraid workspace packages (e.g., `@unraid/shared`).
- For plugin installation and system integration, see the main project documentation.
