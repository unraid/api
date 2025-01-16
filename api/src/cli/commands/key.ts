import { ArgumentConfig, parse } from 'ts-command-line-args';

import { cliLogger } from '@app/core/log';
import { Role } from '@app/graphql/generated/api/types';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service';

enum Command {
    Get = 'get',
    Create = 'create',
}

type KeyFlags = {
    create?: boolean;
    command: string;
    description?: string;
    name: string;
    permissions?: string;
    roles?: string;
};

const validRoles: Set<Role> = new Set(Object.values(Role));

const validateRoles = (rolesStr?: string): Role[] => {
    if (!rolesStr) return [Role.GUEST];

    const requestedRoles = rolesStr.split(',').map((role) => role.trim().toUpperCase() as Role);
    const validRequestedRoles = requestedRoles.filter((role) => validRoles.has(role));

    if (validRequestedRoles.length === 0) {
        throw new Error(`Invalid roles. Valid options are: ${Array.from(validRoles).join(', ')}`);
    }

    const invalidRoles = requestedRoles.filter((role) => !validRoles.has(role));

    if (invalidRoles.length > 0) {
        cliLogger.warn(`Ignoring invalid roles: ${invalidRoles.join(', ')}`);
    }

    return validRequestedRoles;
};

const keyOptions: ArgumentConfig<KeyFlags> = {
    command: { type: String, description: 'get or create' },
    name: { type: String, description: 'Name of the API key', typeLabel: '{underline name}' },
    create: { type: Boolean, optional: true, description: "Create the key if it doesn't exist" },
    description: { type: String, optional: true, description: 'Description of the API key' },
    roles: {
        type: String,
        optional: true,
        description: `Comma-separated list of roles (${Object.values(Role).join(', ')})`,
        typeLabel: '{underline role1,role2}',
    },
    permissions: {
        type: String,
        optional: true,
        description: 'Comma-separated list of permissions',
        typeLabel: '{underline perm1,perm2}',
    },
};

export const key = async (...argv: string[]) => {
    try {
        const options = parse<KeyFlags>(keyOptions, { argv });
        const apiKeyService = new ApiKeyService();

        if (!options.name) {
            throw new Error('Name is required');
        }

        switch (options.command) {
            case Command.Create: {
                const roles = validateRoles(options.roles);
                const key = await apiKeyService.create(
                    options.name,
                    options.description || `CLI generated key: ${options.name}`,
                    roles,
                    true
                );

                cliLogger.info('API Key: ', key);
                cliLogger.info('API key created successfully');

                break;
            }

            case Command.Get: {
                const key = await apiKeyService.findByField('name', options.name);

                if (!key && options.create) {
                    const roles = validateRoles(options.roles);
                    const newKey = await apiKeyService.create(
                        options.name,
                        options.description || `CLI generated key: ${options.name}`,
                        roles,
                        true
                    );

                    cliLogger.info('New API Key: ', newKey);
                    cliLogger.info('API key created successfully');
                } else if (key) {
                    cliLogger.info('API Key: ', key);
                } else {
                    throw new Error(`No API key found with name: ${options.name}`);
                }

                break;
            }

            default:
                throw new Error(`Invalid command. Use: ${Object.values(Command).join(' or ')}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            cliLogger.error(`Failed to process API key: ${error.message}`);
        }

        process.exit(1);
    }
};
