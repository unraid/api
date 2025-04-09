# GraphQL Schema Migration: Schema-First to Code-First

This directory contains the GraphQL resolvers for the Unraid API. We are currently migrating from a schema-first approach to a code-first approach using NestJS decorators.

## Migration Status

We have started migrating the GraphQL schema from schema-first to code-first approach. The following resolvers have been migrated:

- ✅ API Key Resolver

The following resolvers still need to be migrated:

- [ ] Docker Resolver
- [ ] Array Resolver
- [ ] Disks Resolver
- [ ] VMs Resolver
- [ ] Connect Resolver
- [ ] Display Resolver
- [ ] Info Resolver
- [ ] Owner Resolver
- [ ] Unassigned Devices Resolver
- [ ] Cloud Resolver
- [ ] Flash Resolver
- [ ] Config Resolver
- [ ] Vars Resolver
- [ ] Logs Resolver
- [ ] Users Resolver
- [ ] Notifications Resolver
- [ ] Network Resolver
- [ ] Registration Resolver
- [ ] Servers Resolver
- [ ] Services Resolver
- [ ] Shares Resolver

## Migration Process

For each resolver, we follow these steps:

1. Create a model file (e.g., `resolver-name.model.ts`)
2. Define ObjectType classes for return types
3. Define InputType classes for input parameters
4. Update the resolver to use the new model classes
5. Update the resolver decorators to use the new model classes
6. Create a module file (e.g., `resolver-name.module.ts`)
7. Test the resolver to ensure it works correctly

## Migration Tools

We have created the following tools to help with the migration:

- `migration-plan.md`: A detailed plan for migrating the GraphQL schema
- `migration-script.ts`: A script to help identify which resolvers need to be migrated

## Example Migration

See the API Key Resolver for an example of a migrated resolver:

- `api-key.model.ts`: Contains the model classes for the API Key Resolver
- `api-key.resolver.ts`: Contains the resolver implementation using the model classes
- `api-key.module.ts`: Contains the module configuration for the API Key Resolver

## Benefits of Code-First Approach

The code-first approach offers several benefits:

1. **Type Safety**: TypeScript types are used directly in the GraphQL schema
2. **Better IDE Support**: Better autocomplete and type checking
3. **Easier Refactoring**: Refactoring is easier as the types are defined in one place
4. **Better Documentation**: The schema is documented in the code
5. **Easier Testing**: Easier to test as the types are defined in the code

## Next Steps

1. Continue migrating the remaining resolvers
2. Update the GraphQL module configuration to use code-first approach
3. Remove the schema files once all resolvers are migrated

## Resources

- [NestJS GraphQL Documentation](https://docs.nestjs.com/graphql/quick-start)
- [GraphQL Code Generator](https://www.graphql-code-generator.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) 