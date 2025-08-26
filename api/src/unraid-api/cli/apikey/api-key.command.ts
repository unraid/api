import { AuthAction, Resource, Role } from '@unraid/shared/graphql.model.js';
import { Command, CommandRunner, InquirerService, Option } from 'nest-commander';

import type { DeleteApiKeyAnswers } from '@app/unraid-api/cli/apikey/delete-api-key.questions.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AddApiKeyQuestionSet } from '@app/unraid-api/cli/apikey/add-api-key.questions.js';
import { DeleteApiKeyQuestionSet } from '@app/unraid-api/cli/apikey/delete-api-key.questions.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { Permission } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';

interface KeyOptions {
    name: string;
    create: boolean;
    delete?: boolean;
    description?: string;
    roles?: Role[];
    permissions?: Permission[];
}

@Command({
    name: 'apikey',
    description: `Create / Fetch / Delete Connect API Keys - use --create with no arguments for a creation wizard, or --delete to remove keys`,
})
export class ApiKeyCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly apiKeyService: ApiKeyService,
        private readonly inquirerService: InquirerService
    ) {
        super();
    }

    @Option({
        flags: '--name <name>',
        description: 'Name of the key',
    })
    parseName(name: string): string {
        return name;
    }

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
            this.logger.warn(`Ignoring invalid roles: ${invalidRoles.join(', ')}`);
        }

        return validRequestedRoles;
    }

    @Option({
        flags: '-p, --permissions <permissions>',
        description: `Comma separated list of permissions to assign to the key (in the form of "resource:action")
RESOURCES: ${Object.values(Resource).join(', ')}
ACTIONS: ${Object.values(AuthAction).join(', ')}`,
    })
    parsePermissions(permissions: string): Array<Permission> {
        return this.apiKeyService.convertPermissionsStringArrayToPermissions(
            permissions.split(',').filter(Boolean)
        );
    }

    @Option({
        flags: '-d, --description <description>',
        description: 'Description to assign to the key',
    })
    parseDescription(description: string): string {
        return description;
    }

    @Option({
        flags: '--delete',
        description: 'Delete selected API keys',
    })
    parseDelete(): boolean {
        return true;
    }

    /** Prompt the user to select API keys to delete. Then, delete the selected keys. */
    private async deleteKeys() {
        const allKeys = await this.apiKeyService.findAll();
        if (allKeys.length === 0) {
            this.logger.log('No API keys found to delete');
            return;
        }

        const answers = await this.inquirerService.prompt<DeleteApiKeyAnswers>(
            DeleteApiKeyQuestionSet.name,
            {}
        );
        if (!answers.selectedKeys || answers.selectedKeys.length === 0) {
            this.logger.log('No keys selected for deletion');
            return;
        }

        try {
            await this.apiKeyService.deleteApiKeys(answers.selectedKeys);
            this.logger.log(`Successfully deleted ${answers.selectedKeys.length} API keys`);
        } catch (error) {
            this.logger.error(error as any);
            process.exit(1);
        }
    }

    async run(
        _: string[],
        options: KeyOptions = { create: false, name: '', delete: false }
    ): Promise<void> {
        try {
            if (options.delete) {
                await this.deleteKeys();
                return;
            }

            const key = this.apiKeyService.findByField('name', options.name);
            if (key) {
                this.logger.log(key.key);
            } else if (options.create) {
                options = await this.inquirerService.prompt(AddApiKeyQuestionSet.name, options);
                this.logger.log('Creating API Key...' + JSON.stringify(options));

                if (!options.roles && !options.permissions) {
                    this.logger.error('Please add at least one role or permission to the key.');
                    return;
                }
                if (options.roles?.length === 0 && options.permissions?.length === 0) {
                    this.logger.error('Please add at least one role or permission to the key.');
                    return;
                }
                const key = await this.apiKeyService.create({
                    name: options.name,
                    description: options.description || `CLI generated key: ${options.name}`,
                    roles: options.roles,
                    permissions: options.permissions,
                    overwrite: true,
                });

                this.logger.log(key.key);
            } else {
                this.logger.log('No Key Found');
                process.exit(1);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error('API-Key Error: ' + error.message);
            } else {
                this.logger.error('Unexpected Error: ' + error);
            }
            process.exit(1);
        }
    }
}
