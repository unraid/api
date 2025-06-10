import { Directive } from '@nestjs/graphql';

import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import {
    DirectiveLocation,
    GraphQLDirective,
    GraphQLEnumType,
    GraphQLSchema,
    GraphQLString,
} from 'graphql';
import { AuthActionVerb, AuthPossession, UsePermissions as NestAuthzUsePermissions } from 'nest-authz';

// Re-export the types from nest-authz
export { AuthActionVerb, AuthPossession };

const buildGraphQLEnum = (
    enumObj: Record<string, string | number>,
    name: string,
    description: string
) => {
    const values = Object.entries(enumObj)
        .filter(([key]) => isNaN(Number(key)))
        .reduce(
            (acc, [key]) => {
                acc[key] = { value: key };
                return acc;
            },
            {} as Record<string, { value: string }>
        );

    return new GraphQLEnumType({ name, description, values });
};

// Create GraphQL enum types for auth action verbs and possessions
const AuthActionVerbEnum = buildGraphQLEnum(
    AuthActionVerb,
    'AuthActionVerb',
    'Available authentication action verbs'
);

const AuthPossessionEnum = buildGraphQLEnum(
    AuthPossession,
    'AuthPossession',
    'Available authentication possession types'
);

// Create the auth directive
export const UsePermissionsDirective = new GraphQLDirective({
    name: 'usePermissions',
    description: 'Directive to document required permissions for fields',
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        action: {
            type: AuthActionVerbEnum,
            description: 'The action verb required for access',
        },
        resource: {
            type: GraphQLString,
            description: 'The resource required for access',
        },
        possession: {
            type: AuthPossessionEnum,
            description: 'The possession type required for access',
        },
    },
});

// Create a decorator that combines both the GraphQL directive and UsePermissions
export const UsePermissions = (permissions: {
    action: AuthActionVerb;
    resource: string;
    possession: AuthPossession;
}) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        // Apply UsePermissions for actual authorization
        NestAuthzUsePermissions(permissions)(target, propertyKey, descriptor);

        // Apply GraphQL directive using NestJS's @Directive decorator
        Directive(
            `@usePermissions(action: ${permissions.action.toUpperCase()}, resource: "${permissions.resource}", possession: ${permissions.possession.toUpperCase()})`
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
                    possession: possessionValue,
                } = usePermissionsDirective;

                if (!actionValue || !resourceValue || !possessionValue) {
                    console.warn(
                        `UsePermissions directive on ${typeName}.${fieldName} is missing required arguments.`
                    );
                    return fieldConfig;
                }

                // Append permission information to the field description
                const permissionDoc = `
#### Required Permissions:

- Action: **${actionValue}**
- Resource: **${resourceValue}**
- Possession: **${possessionValue}**`;
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
