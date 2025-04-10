import { DirectiveLocation, GraphQLDirective, GraphQLEnumType, GraphQLString } from 'graphql';
import { AuthActionVerb, AuthPossession } from 'nest-authz';

// Create GraphQL enum types for auth action verbs and possessions
export const AuthActionVerbEnum = new GraphQLEnumType({
    name: 'AuthActionVerb',
    description: 'Available authentication action verbs',
    values: Object.entries(AuthActionVerb)
        .filter(([key]) => isNaN(Number(key))) // Filter out numeric keys
        .reduce(
            (acc, [key]) => {
                acc[key] = { value: key };
                return acc;
            },
            {} as Record<string, { value: string }>
        ),
});

export const AuthPossessionEnum = new GraphQLEnumType({
    name: 'AuthPossession',
    description: 'Available authentication possession types',
    values: Object.entries(AuthPossession)
        .filter(([key]) => isNaN(Number(key))) // Filter out numeric keys
        .reduce(
            (acc, [key]) => {
                acc[key] = { value: key };
                return acc;
            },
            {} as Record<string, { value: string }>
        ),
});

// Create the auth directive
export const AuthDirective = new GraphQLDirective({
    name: 'auth',
    description: 'Directive to control access to fields based on authentication',
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
