// This file is for backend use only - contains NestJS decorators
import { Field, InterfaceType, registerEnumType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';
import { PrefixedID } from './prefixed-id-scalar.js';

// Import enums from the shared file
import { AuthAction, Resource, Role } from './graphql-enums.js';

// Re-export for convenience
export { AuthAction, Resource, Role };

// Re-export types from graphql-enums
export type { ApiKey, ApiKeyWithSecret, Permission } from './graphql-enums.js';

@InterfaceType()
export class Node {
    @Field(() => PrefixedID)
    @IsString()
    @IsNotEmpty()
    id!: string;
}

registerEnumType(Resource, {
    name: 'Resource',
    description: 'Available resources for permissions',
});

registerEnumType(Role, {
    name: 'Role',
    description: 'Available roles for API keys and users',
    valuesMap: {
        ADMIN: {
            description: 'Full administrative access to all resources',
        },
        CONNECT: {
            description: 'Internal Role for Unraid Connect',
        },
        GUEST: {
            description: 'Basic read access to user profile only',
        },
        VIEWER: {
            description: 'Read-only access to all resources',
        },
    },
});

// Register AuthAction enum for GraphQL
registerEnumType(AuthAction, {
    name: 'AuthAction',
    description: 'Authentication actions with possession (e.g., create:any, read:own)',
    valuesMap: {
        CREATE_ANY: {
            description: 'Create any resource',
        },
        CREATE_OWN: {
            description: 'Create own resource',
        },
        READ_ANY: {
            description: 'Read any resource',
        },
        READ_OWN: {
            description: 'Read own resource',
        },
        UPDATE_ANY: {
            description: 'Update any resource',
        },
        UPDATE_OWN: {
            description: 'Update own resource',
        },
        DELETE_ANY: {
            description: 'Delete any resource',
        },
        DELETE_OWN: {
            description: 'Delete own resource',
        },
    },
});

