import { Directive } from '@nestjs/graphql';

import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import {
    DirectiveLocation,
    GraphQLDirective,
    GraphQLSchema,
    GraphQLString,
} from 'graphql';
import { UsePermissions as NestAuthzUsePermissions } from 'nest-authz';
// Import from graphql-enums.js to avoid NestJS dependencies
import { AuthAction, AuthActionVerb, AuthPossession, Resource } from './graphql-enums.js';

// Re-export the types for convenience
export { AuthAction, AuthActionVerb, AuthPossession, Resource };

/**
 * GraphQL Directive Definition for @usePermissions
 * 
 * IMPORTANT: GraphQL directives MUST use scalar types (String, Int, Boolean) for their arguments
 * according to the GraphQL specification. This is why action and resource are defined as GraphQLString
 * even though we use enum types in TypeScript.
 * 
 * Type safety is enforced at:
 * 1. Compile-time: TypeScript decorator requires AuthAction and Resource enum types
 * 2. Runtime: The decorator validates that string values match valid enum values
 * 
 * The generated schema will show:
 *   directive @usePermissions(action: String, resource: String) on FIELD_DEFINITION
 * 
 * But the actual usage in code requires proper enum types for type safety.
 */
export const UsePermissionsDirective = new GraphQLDirective({
    name: 'usePermissions',
    description: 'Directive to document required permissions for fields',
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        action: {
            type: GraphQLString,
            description: 'The action required for access (must be a valid AuthAction enum value)',
        },
        resource: {
            type: GraphQLString,
            description: 'The resource required for access (must be a valid Resource enum value)',
        },
    },
});

// Create a decorator that combines both the GraphQL directive and UsePermissions
type PermissionsConfig = 
    | { action: AuthAction; resource: Resource | string }  // New format: action with possession combined
    | { action: AuthActionVerb | string; possession: AuthPossession | string; resource: Resource | string };  // Old format: separate verb and possession

/**
 * UsePermissions Decorator
 * 
 * Applies permission-based authorization to GraphQL resolvers and adds schema documentation.
 * 
 * @example
 * ```typescript
 * @Query(() => [User])
 * @UsePermissions({
 *     action: AuthAction.READ_ANY,
 *     resource: Resource.USERS
 * })
 * async getUsers() { ... }
 * ```
 * 
 * The decorator:
 * 1. Enforces TypeScript type safety with enum types
 * 2. Validates enum values at runtime
 * 3. Applies nest-authz authorization checks
 * 4. Adds @usePermissions directive to GraphQL schema
 * 
 * Note: While the GraphQL schema shows String types for the directive,
 * TypeScript ensures only valid enum values can be used.
 */
export const UsePermissions = (permissions: PermissionsConfig) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        let finalAction: AuthAction;
        let finalResource: string;
        
        // Handle resource - convert enum to string if needed
        if (typeof permissions.resource === 'string') {
            finalResource = permissions.resource;
        } else {
            // Resource enum value
            finalResource = permissions.resource;
        }
        
        // Validate resource enum if provided as enum
        if (typeof permissions.resource !== 'string' && !Object.values(Resource).includes(permissions.resource)) {
            throw new Error(`Invalid Resource enum value: ${permissions.resource}`);
        }
        
        // Determine the final action based on input format
        if ('possession' in permissions) {
            // Old format: combine verb and possession
            const oldFormat = permissions as { action: AuthActionVerb | string; possession: AuthPossession | string; resource: Resource | string };
            const verb = typeof oldFormat.action === 'string' 
                ? oldFormat.action.toLowerCase()
                : (oldFormat.action as AuthActionVerb).toLowerCase();
            const possession = typeof oldFormat.possession === 'string'
                ? oldFormat.possession.toLowerCase()
                : (oldFormat.possession as AuthPossession).toLowerCase();
            finalAction = `${verb}:${possession}` as AuthAction;
            
            // Validate the combined action
            if (!Object.values(AuthAction).includes(finalAction)) {
                throw new Error(`Invalid action combination: ${verb}:${possession}`);
            }
        } else {
            // New format: action already includes possession (AuthAction enum)
            finalAction = permissions.action;
            
            // Validate AuthAction enum
            if (!Object.values(AuthAction).includes(finalAction)) {
                throw new Error(`Invalid AuthAction enum value: ${finalAction}`);
            }
        }
        
        // Apply UsePermissions for actual authorization
        NestAuthzUsePermissions({ action: finalAction, resource: finalResource })(target, propertyKey, descriptor);

        // Apply GraphQL directive using NestJS's @Directive decorator
        Directive(
            `@usePermissions(action: "${finalAction}", resource: "${finalResource}")`
        )(target, propertyKey, descriptor);

        return descriptor;
    };
};

// Schema transformer to add permission documentation
export function usePermissionsSchemaTransformer(schema: GraphQLSchema) {
    return mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig, fieldName, typeName) => {
            const usePermissionsDirective = getDirective(schema, fieldConfig, 'usePermissions')?.[0];
            if (usePermissionsDirective) {
                const {
                    action: actionValue,
                    resource: resourceValue,
                } = usePermissionsDirective;

                if (!actionValue || !resourceValue) {
                    console.warn(
                        `UsePermissions directive on ${typeName}.${fieldName} is missing required arguments.`
                    );
                    return fieldConfig;
                }

                // Append permission information to the field description
                const permissionDoc = `
#### Required Permissions:

- Action: **${actionValue}**
- Resource: **${resourceValue}**`;
                const descriptionDoc = fieldConfig.description
                    ? `

#### Description:

${fieldConfig.description}`
                    : '';
                fieldConfig.description = permissionDoc + descriptionDoc;
            }

            return fieldConfig;
        },
    });
}
