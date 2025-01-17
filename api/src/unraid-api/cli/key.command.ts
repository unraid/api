import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';

import { cliLogger } from '@app/core/log';
import { Role } from '@app/graphql/generated/api/types';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service';

interface KeyOptions {
    create: boolean;
    description?: string;
    roles?: Array<Role>;
    permissions?: Array<unknown>;
}

@Command({ name: 'key', arguments: '<name>' })
export class KeyCommand extends CommandRunner {
    private readonly logger = new Logger(KeyCommand.name);

    @Option({
        flags: '--create',
        description: 'Create a key if not found',
    })
    parseCreate(): boolean {
        return true;
    }

    @Option({
        flags: '-r, --roles <roles>',
        description: `Comma-separated list of roles (${Object.values(Role).join(',')})`,
    })
    parseRoles(roles: string): Role[] {
        if (!roles) return [Role.GUEST];
        const validRoles: Set<Role> = new Set(Object.values(Role));

        const requestedRoles = roles.split(',').map((role) => role.trim().toLocaleLowerCase() as Role);
        const validRequestedRoles = requestedRoles.filter((role) => validRoles.has(role));

        if (validRequestedRoles.length === 0) {
            throw new Error(`Invalid roles. Valid options are: ${Array.from(validRoles).join(', ')}`);
        }

        const invalidRoles = requestedRoles.filter((role) => !validRoles.has(role));

        if (invalidRoles.length > 0) {
            cliLogger.warn(`Ignoring invalid roles: ${invalidRoles.join(', ')}`);
        }

        return validRequestedRoles;
    }

    @Option({
        flags: '-d, --description <description>',
        description: 'Description to assign to the key',
    })
    parseDescription(description: string): string {
        return description;
    }

    @Option({
        flags: '-p, --permissions <permissions>',
        description: 'Comma separated list of permissions to assign to the key',
    })
    parsePermissions(permissions: string) {
        throw new Error('Stub Method Until Permissions PR is merged');
    }

    async run(passedParams: string[], options?: KeyOptions): Promise<void> {
        console.log(options, passedParams);

        const apiKeyService = new ApiKeyService();

        const name = passedParams[0];
        const create = options?.create ?? false;
        const key = await apiKeyService.findByField('name', name);
        if (key) {
            this.logger.log(key);
        } else if (create) {
            if (!options) {
                this.logger.error('Invalid Options for Create Flag');
                return;
            }
            if (options.roles?.length === 0 && options.permissions?.length === 0) {
                this.logger.error(
                    'Please add at least one role or permission with --roles or --permissions'
                );
                return;
            }
            const key = await apiKeyService.create(
                name,
                options.description || `CLI generated key: ${name}`,
                options.roles ?? [],
                true
            );

            this.logger.log(key);
        } else {
            this.logger.log('No Key Found');
            process.exit(1);
        }
    }
}
