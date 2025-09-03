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
    overwrite?: boolean;
    json?: boolean;
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

        const roleArray = roles.split(',').filter(Boolean);
        const validRoles = this.apiKeyService.convertRolesStringArrayToRoles(roleArray);

        if (validRoles.length === 0) {
            throw new Error(`Invalid roles. Valid options are: ${Object.values(Role).join(', ')}`);
        }

        return validRoles;
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

    @Option({
        flags: '--overwrite',
        description: 'Overwrite existing API key if it exists',
    })
    parseOverwrite(): boolean {
        return true;
    }

    @Option({
        flags: '--json',
        description: 'Output machine-readable JSON format',
    })
    parseJson(): boolean {
        return true;
    }

    /** Helper to output either JSON or regular log message */
    private output(message: string, jsonData?: object, jsonOutput?: boolean): void {
        if (jsonOutput && jsonData) {
            console.log(JSON.stringify(jsonData));
        } else {
            this.logger.log(message);
        }
    }

    /** Helper to output either JSON or regular error message */
    private outputError(message: string, jsonData?: object, jsonOutput?: boolean): void {
        if (jsonOutput && jsonData) {
            console.log(JSON.stringify(jsonData));
        } else {
            this.logger.error(message);
        }
    }

    /** Delete API keys either by name (non-interactive) or by prompting user selection (interactive). */
    private async deleteKeys(name?: string, jsonOutput?: boolean) {
        const allKeys = await this.apiKeyService.findAll();
        if (allKeys.length === 0) {
            this.output(
                'No API keys found to delete',
                { deleted: 0, message: 'No API keys found to delete' },
                jsonOutput
            );
            return;
        }

        let selectedKeyIds: string[];
        let deletedKeys: { id: string; name: string }[] = [];

        if (name) {
            // Non-interactive mode: delete by name
            const keyToDelete = allKeys.find((key) => key.name === name);
            if (!keyToDelete) {
                this.outputError(
                    `No API key found with name: ${name}`,
                    { deleted: 0, error: `No API key found with name: ${name}` },
                    jsonOutput
                );
                process.exit(1);
            }
            selectedKeyIds = [keyToDelete.id];
            deletedKeys = [{ id: keyToDelete.id, name: keyToDelete.name }];
        } else {
            // Interactive mode: prompt user to select keys
            const answers = await this.inquirerService.prompt<DeleteApiKeyAnswers>(
                DeleteApiKeyQuestionSet.name,
                {}
            );
            if (!answers.selectedKeys || answers.selectedKeys.length === 0) {
                this.output(
                    'No keys selected for deletion',
                    { deleted: 0, message: 'No keys selected for deletion' },
                    jsonOutput
                );
                return;
            }
            selectedKeyIds = answers.selectedKeys;
            deletedKeys = allKeys
                .filter((key) => selectedKeyIds.includes(key.id))
                .map((key) => ({ id: key.id, name: key.name }));
        }

        try {
            await this.apiKeyService.deleteApiKeys(selectedKeyIds);
            const message = `Successfully deleted ${selectedKeyIds.length} API key${selectedKeyIds.length === 1 ? '' : 's'}`;
            this.output(message, { deleted: selectedKeyIds.length, keys: deletedKeys }, jsonOutput);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputError(errorMessage, { deleted: 0, error: errorMessage }, jsonOutput);
            process.exit(1);
        }
    }

    async run(
        _: string[],
        options: KeyOptions = { create: false, name: '', delete: false }
    ): Promise<void> {
        try {
            if (options.delete) {
                await this.deleteKeys(options.name, options.json);
                return;
            }

            const key = this.apiKeyService.findByField('name', options.name);
            if (key) {
                this.output(key.key, { key: key.key, name: key.name, id: key.id }, options.json);
            } else if (options.create) {
                // Check if we have minimum required info from flags (name + at least one role or permission)
                const hasMinimumInfo =
                    options.name &&
                    ((options.roles && options.roles.length > 0) ||
                        (options.permissions && options.permissions.length > 0));

                if (!hasMinimumInfo) {
                    // Interactive mode - prompt for missing fields
                    options = await this.inquirerService.prompt(AddApiKeyQuestionSet.name, options);
                } else {
                    // Non-interactive mode - check if key exists and handle overwrite
                    const existingKey = this.apiKeyService.findByField('name', options.name);
                    if (existingKey && !options.overwrite) {
                        this.outputError(
                            `API key with name '${options.name}' already exists. Use --overwrite to replace it.`,
                            {
                                error: `API key with name '${options.name}' already exists. Use --overwrite to replace it.`,
                            },
                            options.json
                        );
                        process.exit(1);
                    }
                }

                if (!options.json) {
                    this.logger.log('Creating API Key...');
                }

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
                    overwrite: options.overwrite ?? false,
                });

                this.output(key.key, { key: key.key, name: key.name, id: key.id }, options.json);
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
