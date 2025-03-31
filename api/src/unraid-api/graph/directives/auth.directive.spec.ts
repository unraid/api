import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLResolveInfo, GraphQLSchema } from 'graphql';
import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    authSchemaTransformer,
    getAuthEnumTypeDefs,
    transformResolvers,
} from '@app/unraid-api/graph/directives/auth.directive.js';

// Mock UsePermissions function
vi.mock('nest-authz', () => ({
    AuthActionVerb: {
        READ: 'READ',
        CREATE: 'CREATE',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE',
    },
    AuthPossession: {
        OWN: 'OWN',
        ANY: 'ANY',
    },
    UsePermissions: vi.fn(),
}));

describe('Auth Directive', () => {
    let schema: GraphQLSchema;

    const typeDefs = `
    ${getAuthEnumTypeDefs()}
    
    type Query {
      protectedField: String @auth(action: READ, resource: "USER", possession: OWN)
      unprotectedField: String
    }
  `;

    const resolvers = {
        Query: {
            protectedField: () => 'protected data',
            unprotectedField: () => 'public data',
        },
    };

    beforeEach(() => {
        // Create schema for each test
        schema = makeExecutableSchema({
            typeDefs,
            resolvers: transformResolvers(resolvers),
        });

        // Apply our auth schema transformer
        schema = authSchemaTransformer(schema);

        // Reset all mocks
        vi.clearAllMocks();
    });

    describe('authSchemaTransformer', () => {
        it('should add permission information to field description', () => {
            const queryType = schema.getQueryType();
            if (!queryType) throw new Error('Query type not found in schema');
            const protectedField = queryType.getFields().protectedField;

            expect(protectedField.description).toContain('Required Permissions');
            expect(protectedField.description).toContain('Action: **READ**');
            expect(protectedField.description).toContain('Resource: **USER**');
            expect(protectedField.description).toContain('Possession: **OWN**');
        });

        it('should store permission requirements in field extensions', () => {
            const queryType = schema.getQueryType();
            if (!queryType) throw new Error('Query type not found in schema');
            const protectedField = queryType.getFields().protectedField;

            expect(protectedField.extensions).toBeDefined();
            expect(protectedField.extensions.requiredPermissions).toEqual({
                action: 'READ',
                resource: 'USER',
                possession: 'OWN',
            });
        });

        it('should not modify fields without auth directive', () => {
            const queryType = schema.getQueryType();
            if (!queryType) throw new Error('Query type not found in schema');
            const unprotectedField = queryType.getFields().unprotectedField;

            expect(unprotectedField.extensions?.requiredPermissions).toBeUndefined();
            expect(unprotectedField.description).toBeFalsy();
        });
    });

    describe('transformResolvers', () => {
        it('should wrap resolvers to check permissions before execution', async () => {
            const queryType = schema.getQueryType();
            if (!queryType) throw new Error('Query type not found in schema');
            const protectedField = queryType.getFields().protectedField;

            const mockSource = {};
            const mockArgs = {};
            const mockContext: { requiredPermissions?: any } = {};

            // Instead of mocking GraphQLResolveInfo, we can invoke the wrapped resolver directly
            // Create a simple function to extract the resolver and call it with our mock objects
            const testResolver = async () => {
                if (!schema.getQueryType()) return;

                // Get the schema fields
                const queryFields = schema.getQueryType()!.getFields();

                // Call the manually wrapped resolver
                if (queryFields.protectedField && queryFields.protectedField.resolve) {
                    const result = await queryFields.protectedField.resolve(
                        mockSource,
                        mockArgs,
                        mockContext,
                        {
                            fieldName: 'protectedField',
                            parentType: { name: 'Query' },
                            schema,
                            // We need these fields, but they aren't actually used in the auth directive code
                            fieldNodes: [] as any,
                            returnType: {} as any,
                            path: {} as any,
                            fragments: {} as any,
                            rootValue: null as any,
                            operation: {} as any,
                            variableValues: {} as any,
                        } as unknown as GraphQLResolveInfo
                    );
                    return result;
                }
            };

            await testResolver();

            // Check that permissions were set in context
            expect(mockContext).toHaveProperty('requiredPermissions');
            expect(mockContext.requiredPermissions).toEqual({
                action: 'READ',
                resource: 'USER',
                possession: 'OWN',
            });

            // Check that UsePermissions was called with the right params
            expect(UsePermissions).toHaveBeenCalledWith({
                action: 'READ',
                resource: 'USER',
                possession: 'OWN',
            });
        });

        it('should not apply permissions for unprotected fields', async () => {
            const queryType = schema.getQueryType();
            if (!queryType) throw new Error('Query type not found in schema');
            const unprotectedField = queryType.getFields().unprotectedField;

            const mockSource = {};
            const mockArgs = {};
            const mockContext: { requiredPermissions?: any } = {};

            // Instead of mocking GraphQLResolveInfo, we can invoke the wrapped resolver directly
            const testResolver = async () => {
                if (!schema.getQueryType()) return;

                // Get the schema fields
                const queryFields = schema.getQueryType()!.getFields();

                // Call the manually wrapped resolver
                if (queryFields.unprotectedField && queryFields.unprotectedField.resolve) {
                    const result = await queryFields.unprotectedField.resolve(
                        mockSource,
                        mockArgs,
                        mockContext,
                        {
                            fieldName: 'unprotectedField',
                            parentType: { name: 'Query' },
                            schema,
                            // We need these fields, but they aren't actually used in the auth directive code
                            fieldNodes: [] as any,
                            returnType: {} as any,
                            path: {} as any,
                            fragments: {} as any,
                            rootValue: null as any,
                            operation: {} as any,
                            variableValues: {} as any,
                        } as unknown as GraphQLResolveInfo
                    );
                    return result;
                }
                return;
            };

            await testResolver();

            // Check that permissions were not set or checked
            expect(mockContext.requiredPermissions).toBeUndefined();
            expect(UsePermissions).not.toHaveBeenCalled();
        });

        it('should handle an array of resolvers', () => {
            const resolversArray = [
                { Query: { field1: () => 'data' } },
                { Mutation: { field2: () => 'data' } },
            ] as any; // Type assertion to avoid complex IResolvers typing

            const transformed = transformResolvers(resolversArray);
            expect(Array.isArray(transformed)).toBe(true);
            expect(transformed).toHaveLength(2);
        });
    });

    describe('getAuthEnumTypeDefs', () => {
        it('should generate valid SDL for auth enums', () => {
            const typeDefs = getAuthEnumTypeDefs();

            expect(typeDefs).toContain('enum AuthActionVerb');
            expect(typeDefs).toContain('enum AuthPossession');
            expect(typeDefs).toContain('directive @auth');

            // Check for enum values
            Object.keys(AuthActionVerb)
                .filter((key) => isNaN(Number(key)))
                .forEach((key) => {
                    expect(typeDefs).toContain(key);
                });

            Object.keys(AuthPossession)
                .filter((key) => isNaN(Number(key)))
                .forEach((key) => {
                    expect(typeDefs).toContain(key);
                });
        });
    });
});
