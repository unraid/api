import { getDirective, IResolvers, MapperKind, mapSchema } from '@graphql-tools/utils';
import { GraphQLEnumType, GraphQLSchema } from 'graphql';
import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource } from '@app/graphql/generated/api/types.js';

export function transformResolvers(resolvers: IResolvers | IResolvers[]): IResolvers | IResolvers[] {
    if (Array.isArray(resolvers)) {
        return resolvers.map((r) => transformResolvers(r)) as IResolvers[];
    }

    // Iterate over each type in the resolvers object
    Object.keys(resolvers).forEach((typeName) => {
        const typeResolvers = resolvers[typeName];
        // Iterate over each field within the type
        Object.keys(typeResolvers).forEach((fieldName) => {
            const fieldResolver = typeResolvers[fieldName];
            // Skip non-function resolvers (or if it's not defined)
            if (typeof fieldResolver !== 'function') {
                return;
            }
            // Check if this field has permission metadata in its extensions property
            // We need to wrap the resolver in a function that checks if the user has the required permissions

            const originalResolver = fieldResolver;

            // Create a wrapped resolver that will extract permissions from info
            typeResolvers[fieldName] = async (source, args, context, info) => {
                // Access the extensions from the field definition in the schema
                const fieldExtensions = info.schema.getType(info.parentType.name).getFields()[
                    info.fieldName
                ].extensions;

                if (fieldExtensions?.requiredPermissions) {
                    const { action, resource, possession } = fieldExtensions.requiredPermissions;

                    if (context) {
                        context.requiredPermissions = {
                            action: action.toUpperCase(),
                            resource: resource.toUpperCase(),
                            possession: possession.toUpperCase(),
                        };

                        // Call UsePermissions before executing the resolver
                        UsePermissions(context.requiredPermissions);

                        console.log(
                            `In resolver for ${typeName}.${fieldName} with permissions:`,
                            context?.requiredPermissions
                        );
                    }
                }

                // Call the original resolver after permission check
                return await originalResolver(source, args, context, info);
            };
        });
    });

    return resolvers;
}

export function authSchemaTransformer(schema: GraphQLSchema): GraphQLSchema {
    return mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig, fieldName, typeName) => {
            const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0];

            if (authDirective) {
                const {
                    action: actionValue,
                    resource: resourceValue,
                    possession: possessionValue,
                } = authDirective;

                if (!actionValue || !resourceValue || !possessionValue) {
                    console.warn(
                        `Auth directive on ${typeName}.${fieldName} is missing required arguments.`
                    );
                    return fieldConfig;
                }

                // Append permission information to the field description
                const permissionDoc = `
                
#### Required Permissions:

- Action: **${actionValue}**
- Resource: **${resourceValue}**
- Possession: **${possessionValue}**`;
                const newDescription = fieldConfig.description
                    ? `${fieldConfig.description}${permissionDoc}`
                    : permissionDoc;
                fieldConfig.description = newDescription;

                // Store the required permissions in the field config extensions
                fieldConfig.extensions = {
                    ...fieldConfig.extensions,
                    requiredPermissions: {
                        action: actionValue.toUpperCase() as AuthActionVerb,
                        resource: resourceValue.toUpperCase() as Resource,
                        possession: possessionValue.toUpperCase() as AuthPossession,
                    },
                };
            }

            return fieldConfig;
        },
    });
}

/**
 * Generates GraphQL SDL strings for the authentication enums.
 */
export function getAuthEnumTypeDefs(): string {
    // Helper to generate enum values string part with descriptions
    const getEnumValues = <T>(tsEnum: Record<string, T>): string => {
        return Object.entries(tsEnum)
            .filter(([key]) => isNaN(Number(key))) // Filter out numeric keys
            .map(([key]) => `  ${key}`)
            .join('\n');
    };

    return `"""
Available authentication action verbs
"""
enum AuthActionVerb {
${getEnumValues(AuthActionVerb)}
}

"""
Available authentication possession types
"""
enum AuthPossession {
${getEnumValues(AuthPossession)}
}

directive @auth(
  action: AuthActionVerb!, 
  resource: String!, 
  possession: AuthPossession!
) on FIELD_DEFINITION
`;
}

/**
 * Generic function to convert TypeScript enums to GraphQL enums
 * (Kept for potential other uses, but not used for Auth enums in schema generation anymore)
 */
export function createGraphQLEnumFromTSEnum<T>(
    tsEnum: Record<string, T>,
    name: string,
    description: string
): GraphQLEnumType {
    const enumValues = {};

    Object.keys(tsEnum).forEach((key) => {
        if (isNaN(Number(key))) {
            // Skip numeric keys (enum in TS has both string and number keys)
            enumValues[key] = { value: tsEnum[key] };
        }
    });

    return new GraphQLEnumType({
        name,
        description,
        values: enumValues,
    });
}
