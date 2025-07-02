# @unraid-api-plugin-connect/src

This directory contains the core source code for the Unraid Connect API plugin, built as a modular [NestJS](https://nestjs.com/) application. It provides remote access, cloud integration, and configuration management for Unraid servers.

## Structure
- **index.ts**: Main entry, conforming to the `nestjs` API plugin schema.
- **module/**: NestJS modules. Organizes concerns. Also configures the dependency injection contexts.
- **service/**: Business logic & implementation.
- **model/**: TypeScript and GraphQL models, dto's, and types.
- **resolver/**: GraphQL resolvers.
- **event-handler/**: Event-driven handlers.
- **job/**: Background jobs (e.g., connection timeout checker).
- **helper/**: Utility functions and constants.
- **graphql/**: GraphQL request definitions and generated client code.
- **test/**: Vitest-based unit and integration tests for services.

`*.events.ts`: event handler container; responding to events
`*.config.{model,service}.ts`: data types and interface around config

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
- Codegen (GraphQL): `npm run codegen`
- Tests: `vitest` (see `test/` for examples)

## Notes
- Designed for Unraid server environments.
- Relies on other Unraid workspace packages (e.g., `@unraid/shared`).
- For plugin installation and system integration, see the main project documentation.
