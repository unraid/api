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

// New format: action with possession combined (no possession property allowed)
type NewFormatPermissions = {
    action: AuthAction;
    resource: Resource;
    possession?: never;  // Explicitly disallow possession property
};

// Old format: separate verb and possession (action must be verb only)
type OldFormatPermissions = {
    action: AuthActionVerb | string;
    possession: AuthPossession | string;
    resource: Resource;
};

/**
 * UsePermissions Decorator
 * 
 * Applies permission-based authorization to GraphQL resolvers and adds schema documentation.
 * 
 * @example New format with combined action:
 * ```typescript
 * @Query(() => [User])
 * @UsePermissions({
 *     action: AuthAction.READ_ANY,
 *     resource: Resource.USERS
 * })
 * async getUsers() { ... }
 * ```
 * 
 * @example Old format with separate verb and possession:
 * ```typescript
 * @Query(() => [User])
 * @UsePermissions({
 *     action: AuthActionVerb.READ,
 *     possession: AuthPossession.ANY,
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
export function UsePermissions(permissions: NewFormatPermissions): MethodDecorator;
export function UsePermissions(permissions: OldFormatPermissions): MethodDecorator;
export function UsePermissions(permissions: NewFormatPermissions | OldFormatPermissions): MethodDecorator {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        let finalAction: AuthAction;
        // Validate and get the resource value
        // TypeScript now ensures this is a Resource enum value at compile time
        const finalResource = permissions.resource;
        
        // Runtime validation as a safety check
        if (!Object.values(Resource).includes(finalResource)) {
            throw new Error(
                `Invalid Resource enum value: ${finalResource}. Must be one of: ${Object.values(Resource).join(', ')}`
            );
        }
        
        // Determine the final action based on input format
        // Detect "combined" actions early (e.g., "READ_ANY") to avoid double-combining.
        const maybeCombined =
            (permissions as any)?.action &&
            typeof (permissions as any).action === 'string' &&
            (permissions as any).action.includes('_');

        // Check if this might be using AuthActionVerb without possession
        const isVerbOnly = !maybeCombined && 
            !('possession' in permissions) &&
            typeof (permissions as any).action === 'string' &&
            ['CREATE', 'READ', 'UPDATE', 'DELETE'].includes((permissions as any).action.toUpperCase());

        if (('possession' in permissions || isVerbOnly) && !maybeCombined) {
            // Old format: combine verb and possession
            const oldFormat = permissions as { action: AuthActionVerb | string; possession?: AuthPossession | string; resource: Resource | string };
            const actionStr = typeof oldFormat.action === 'string' ? oldFormat.action : (oldFormat.action as AuthActionVerb);
            const verb = actionStr.toUpperCase().trim();
            // Default to 'ANY' if possession is not provided
            const possessionStr = oldFormat.possession ? 
                (typeof oldFormat.possession === 'string' ? oldFormat.possession : (oldFormat.possession as AuthPossession)) :
                'ANY';
            const possession = possessionStr.toUpperCase().trim();
            // Convert to new AuthAction format (e.g., "CREATE" + "ANY" -> "CREATE_ANY")
            finalAction = `${verb}_${possession}` as AuthAction;

            // Validate the combined action
            if (!Object.values(AuthAction).includes(finalAction)) {
                throw new Error(
                    `Invalid action combination: "${verb}_${possession}" (converted to "${finalAction}"). ` +
                    `Valid AuthAction values are: ${Object.values(AuthAction).join(', ')}`
                );
            }
        } else {
            // New format: action already includes possession (AuthAction enum)
            finalAction = (maybeCombined ? (permissions as any).action : permissions.action) as AuthAction;
            
            // Validate AuthAction enum
            if (!Object.values(AuthAction).includes(finalAction)) {
                throw new Error(
                    `Invalid AuthAction enum value: "${finalAction}". ` +
                    `Valid AuthAction values are: ${Object.values(AuthAction).join(', ')}`
                );
            }
        }
        
        // Escape values for safe SDL injection
        const escapeForSDL = (value: string): string => {
            // Validate that the value only contains expected characters
            // Allow uppercase/lowercase letters and underscores (for actions like "READ_ANY")
            const allowedPattern = /^[A-Za-z_]+$/;
            
            if (!allowedPattern.test(value)) {
                throw new Error(
                    `Invalid characters in permission value: "${value}". Only letters and underscores are allowed.`
                );
            }
            
            // Escape special characters for GraphQL string literals
            return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        };
        
        const escapedAction = escapeForSDL(finalAction);
        const escapedResource = escapeForSDL(finalResource);
        
        // Apply UsePermissions for actual authorization
        NestAuthzUsePermissions({ action: finalAction, resource: finalResource })(target, propertyKey, descriptor);

        // Apply GraphQL directive using NestJS's @Directive decorator with escaped values
        Directive(
            `@usePermissions(action: "${escapedAction}", resource: "${escapedResource}")`
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
