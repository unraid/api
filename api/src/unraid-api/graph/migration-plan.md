# GraphQL Schema Migration Plan: Schema-First to Code-First

## Overview

This document outlines the plan to migrate the GraphQL schema from schema-first approach to code-first approach using NestJS decorators.

## Migration Steps

1. **Create Base Models**
   - ✅ Create `base.model.ts` with common enums (Resource, Role)
   - ✅ Register enums with `registerEnumType`

2. **Migrate Each Resolver**
   - ✅ API Key Resolver
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

3. **For Each Resolver**:
   - Create a model file (e.g., `resolver-name.model.ts`)
   - Define ObjectType classes for return types
   - Define InputType classes for input parameters
   - Update the resolver to use the new model classes
   - Update the resolver decorators to use the new model classes

4. **Update GraphQL Module Configuration**
   - Remove schema loading from `loadTypesDefs.ts`
   - Update the GraphQL module to use code-first approach

5. **Remove Schema Files**
   - Once all resolvers are migrated, remove the schema files

## Example Migration Pattern

For each resolver:

1. Create model file:
   ```typescript
   // resolver-name.model.ts
   import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
   
   @ObjectType()
   export class SomeType {
     @Field(() => ID)
     id!: string;
     
     // other fields
   }
   
   @InputType()
   export class SomeInput {
     @Field()
     name!: string;
     
     // other fields
   }
   ```

2. Update resolver:
   ```typescript
   // resolver-name.resolver.ts
   import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
   import { SomeType, SomeInput } from './resolver-name.model';
   
   @Resolver(() => SomeType)
   export class SomeResolver {
     @Query(() => [SomeType])
     async someQuery(): Promise<SomeType[]> {
       // implementation
     }
     
     @Mutation(() => SomeType)
     async someMutation(@Args('input') input: SomeInput): Promise<SomeType> {
       // implementation
     }
   }
   ```

3. Create module file:
   ```typescript
   // resolver-name.module.ts
   import { Module } from '@nestjs/common';
   import { SomeResolver } from './resolver-name.resolver';
   
   @Module({
     providers: [SomeResolver],
     exports: [SomeResolver],
   })
   export class SomeModule {}
   ```

## Testing

After migrating each resolver:
1. Test the resolver to ensure it works correctly
2. Check for any type errors or runtime errors
3. Verify that the GraphQL schema is generated correctly

## Rollback Plan

If issues arise during migration:
1. Keep the schema files until the migration is complete and tested
2. If necessary, revert to schema-first approach by restoring the schema files and removing the code-first changes 