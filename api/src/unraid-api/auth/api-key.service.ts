import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import crypto from 'crypto';
import { readdir, readFile, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

import { AuthAction, Resource, Role } from '@unraid/shared/graphql.model.js';
import { normalizeLegacyActions } from '@unraid/shared/util/permissions.js';
import { watch } from 'chokidar';
import { ValidationError } from 'class-validator';
import { ensureDirSync } from 'fs-extra';
import { GraphQLError } from 'graphql';
import { v4 as uuidv4 } from 'uuid';

import { environment } from '@app/environment.js';
import { getters } from '@app/store/index.js';
import {
    AddPermissionInput,
    ApiKey,
    Permission,
} from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';
import { validateObject } from '@app/unraid-api/graph/resolvers/validation.utils.js';
import { batchProcess } from '@app/utils.js';

@Injectable()
export class ApiKeyService implements OnModuleInit {
    private readonly logger = new Logger(ApiKeyService.name);
    protected readonly basePath: string;
    protected memoryApiKeys: Array<ApiKey> = [];
    private static readonly validRoles: Set<Role> = new Set(Object.values(Role));

    constructor() {
        this.basePath = getters.paths()['auth-keys'];
        ensureDirSync(this.basePath);
    }

    async onModuleInit() {
        this.memoryApiKeys = await this.loadAllFromDisk();
        await this.cleanupLegacyInternalKeys();
        if (environment.IS_MAIN_PROCESS) {
            this.setupWatch();
        }
    }

    private async cleanupLegacyInternalKeys() {
        const legacyNames = ['CliInternal', 'ConnectInternal'];
        const keysToDelete = this.memoryApiKeys.filter((key) => legacyNames.includes(key.name));

        if (keysToDelete.length > 0) {
            try {
                await this.deleteApiKeys(keysToDelete.map((key) => key.id));
                this.logger.log(`Cleaned up ${keysToDelete.length} legacy internal keys`);
            } catch (error) {
                this.logger.debug(
                    error,
                    `Failed to delete legacy internal keys: ${keysToDelete.map((key) => key.name).join(', ')}`
                );
            }
        }
    }

    public async findAll(): Promise<ApiKey[]> {
        return this.memoryApiKeys;
    }

    private setupWatch() {
        watch(this.basePath, { ignoreInitial: false }).on('all', async (path) => {
            this.logger.debug(`API key changed: ${path}`);
            this.memoryApiKeys = [];
            this.memoryApiKeys = await this.loadAllFromDisk();
        });
    }

    private sanitizeName(name: string): string {
        if (/^[\p{L}\p{N} ]+$/u.test(name)) {
            return name;
        } else {
            throw new GraphQLError(
                'API key name must contain only letters, numbers, and spaces (Unicode letters are supported)'
            );
        }
    }

    public getAllValidPermissions(): Permission[] {
        return Object.values(Resource).map((res) => ({
            resource: res,
            actions: Object.values(AuthAction),
        }));
    }

    public convertPermissionsStringArrayToPermissions(permissions: string[]): Permission[] {
        return permissions.reduce<Array<Permission>>((acc, permission) => {
            const [resource, ...actionParts] = permission.split(':');
            const action = actionParts.join(':'); // Handle actions like "read:any"
            const validatedResource = Resource[resource.toUpperCase() as keyof typeof Resource] ?? null;
            // Pull the actual enum value from the graphql schema
            const validatedAction =
                AuthAction[action.toUpperCase().replace(':', '_') as keyof typeof AuthAction] ?? null;
            if (validatedAction && validatedResource) {
                const existingEntry = acc.find((p) => p.resource === validatedResource);
                if (existingEntry) {
                    existingEntry.actions.push(validatedAction);
                } else {
                    acc.push({ resource: validatedResource, actions: [validatedAction] });
                }
            } else {
                this.logger.warn(`Invalid permission / action specified: ${permission}:${action}`);
            }
            return acc;
        }, [] as Array<Permission>);
    }

    public convertRolesStringArrayToRoles(roles: string[]): Role[] {
        const validRoles: Role[] = [];
        const invalidRoles: string[] = [];

        for (const roleStr of roles) {
            const upperRole = roleStr.trim().toUpperCase();
            const role = Role[upperRole as keyof typeof Role];

            if (role && ApiKeyService.validRoles.has(role)) {
                validRoles.push(role);
            } else {
                invalidRoles.push(roleStr);
            }
        }

        if (invalidRoles.length > 0) {
            this.logger.warn(`Ignoring invalid roles: ${invalidRoles.join(', ')}`);
        }

        return validRoles;
    }

    async create({
        name,
        description,
        roles,
        permissions,
        overwrite = false,
    }: {
        name: string;
        description?: string;
        roles?: Role[];
        permissions?: Permission[] | AddPermissionInput[];
        overwrite?: boolean;
    }): Promise<ApiKey> {
        const trimmedName = name?.trim();
        const sanitizedName = this.sanitizeName(trimmedName);

        if (!trimmedName) {
            throw new GraphQLError('API key name is required');
        }

        if (!roles?.length && !permissions?.length) {
            throw new GraphQLError('At least one role or permission must be specified');
        }

        if (roles?.some((role) => !ApiKeyService.validRoles.has(role))) {
            throw new GraphQLError('Invalid role specified');
        }

        const existingKey = this.findByField('name', sanitizedName);
        if (!overwrite && existingKey) {
            return existingKey;
        }
        const apiKey: Partial<ApiKey> = {
            id: uuidv4(),
            key: this.generateApiKey(),
            name: sanitizedName,
            ...(existingKey ?? {}),
        };

        apiKey.description = description;
        apiKey.roles = roles;
        apiKey.permissions = permissions ?? [];
        // Update createdAt date
        apiKey.createdAt = new Date().toISOString();

        await this.saveApiKey(apiKey as ApiKey);

        return apiKey as ApiKey;
    }

    async loadAllFromDisk(): Promise<ApiKey[]> {
        const files = await readdir(this.basePath).catch((error) => {
            this.logger.error(`Failed to read API key directory: ${error}`);
            throw new Error('Failed to list API keys');
        });

        const apiKeys: ApiKey[] = [];
        const jsonFiles = files.filter((file) => file.includes('.json'));

        for (const file of jsonFiles) {
            try {
                const apiKey = await this.loadApiKeyFile(file);

                if (apiKey) {
                    apiKeys.push(apiKey);
                }
            } catch (err) {
                this.logger.error(`Error loading API key from file ${file}: ${err}`);
            }
        }

        return apiKeys;
    }

    /**
     * Loads an API key file from the disk and validates it
     * @param file The file to load
     * @returns The API key with secret
     */
    private async loadApiKeyFile(file: string): Promise<ApiKey | null> {
        try {
            const content = await readFile(join(this.basePath, file), 'utf8');

            // First convert all the strings in roles and permissions to uppercase (this ensures that casing is never an issue)
            const parsedContent = JSON.parse(content);

            if (parsedContent.roles) {
                parsedContent.roles = parsedContent.roles.map((role: string) => role.toUpperCase());
            }

            // Normalize permission actions to AuthAction enum values
            // Uses shared helper to handle all legacy formats
            if (parsedContent.permissions) {
                parsedContent.permissions = parsedContent.permissions.map((permission: any) => ({
                    ...permission,
                    actions: normalizeLegacyActions(permission.actions || []),
                }));
            }

            return await validateObject(ApiKey, parsedContent);
        } catch (error) {
            if (error instanceof SyntaxError) {
                this.logger.error(`Corrupted key file: ${file}`);
                throw new Error('Authentication system error: Corrupted key file');
            }

            if (error instanceof ValidationError) {
                this.logger.error(`Error validating API key file ${file}: ${error}`);
                throw new Error('Invalid API key structure');
            }

            this.logger.warn(`Error reading API key file ${file}: ${error}`);

            return null;
        }
    }

    async findById(id: string): Promise<ApiKey | null> {
        try {
            return this.findByField('id', id);
        } catch (error) {
            if (error instanceof ValidationError) {
                this.logApiKeyValidationError(id, error);
                throw new Error('Invalid API key structure');
            }
            throw error;
        }
    }

    public findByField(field: keyof ApiKey, value: string): ApiKey | null {
        if (!value) return null;

        return this.memoryApiKeys.find((k) => k[field] === value) ?? null;
    }

    findByKey(key: string): ApiKey | null {
        return this.findByField('key', key);
    }

    private generateApiKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    private logApiKeyValidationError(file: string, error: ValidationError): void {
        this.logger.error(`Invalid API key structure in file ${file}.
                    Errors: ${JSON.stringify(error.constraints, null, 2)}`);
    }

    public async saveApiKey(apiKey: ApiKey): Promise<void> {
        try {
            const validatedApiKey = await validateObject(ApiKey, apiKey);
            if (!validatedApiKey.permissions?.length && !validatedApiKey.roles?.length) {
                throw new GraphQLError('At least one of permissions or roles must be specified');
            }

            const sortedApiKey = Object.keys(validatedApiKey)
                .sort()
                .reduce((acc, key) => {
                    acc[key] = validatedApiKey[key];
                    return acc;
                }, {} as ApiKey);

            await writeFile(
                join(this.basePath, `${validatedApiKey.id}.json`),
                JSON.stringify(sortedApiKey, null, 2)
            );
        } catch (error: unknown) {
            if (error instanceof ValidationError) {
                this.logApiKeyValidationError(apiKey.id, error);
                throw new GraphQLError('Failed to save API key: Invalid data structure');
            } else if (error instanceof Error) {
                throw new GraphQLError(`Failed to save API key: ${error.message}`);
            } else {
                throw new GraphQLError('Failed to save API key: Unknown error');
            }
        }
    }

    public getPaths() {
        return {
            basePath: this.basePath,
        };
    }

    /**
     * Deletes API keys from the disk and updates the in-memory store.
     *
     * This method first verifies that all the provided API key IDs exist in the in-memory store.
     * If any keys are missing, it throws an Error detailing the missing keys.
     * It then deletes the corresponding JSON files concurrently using batch processing.
     * If any errors occur during the file deletion process, an array of errors is thrown.
     *
     * @param ids An array of API key identifiers to delete.
     * @throws Error if one or more API keys are not found.
     * @throws Array<Error> if errors occur during the file deletion.
     */
    public async deleteApiKeys(ids: string[]): Promise<void> {
        // First verify all keys exist
        const missingKeys = ids.filter((id) => !this.findByField('id', id));
        if (missingKeys.length > 0) {
            throw new Error(`API keys not found: ${missingKeys.join(', ')}`);
        }

        // Delete all files in parallel
        const { errors, data: deletedIds } = await batchProcess(ids, async (id) => {
            await unlink(join(this.basePath, `${id}.json`));
            return id;
        });

        const deletedSet = new Set(deletedIds);
        this.memoryApiKeys = this.memoryApiKeys.filter((key) => !deletedSet.has(key.id));
        if (errors.length > 0) {
            throw errors;
        }
    }

    async update({
        id,
        name,
        description,
        roles,
        permissions,
    }: {
        id: string;
        name?: string;
        description?: string;
        roles?: Role[];
        permissions?: Permission[] | AddPermissionInput[];
    }): Promise<ApiKey> {
        const apiKey = await this.findById(id);
        if (!apiKey) {
            throw new GraphQLError('API key not found');
        }
        if (name) {
            apiKey.name = this.sanitizeName(name.trim());
        }
        if (description !== undefined) {
            apiKey.description = description;
        }
        if (roles !== undefined) {
            // Handle both empty array (to clear roles) and populated array
            if (roles.some((role) => !ApiKeyService.validRoles.has(role))) {
                throw new GraphQLError('Invalid role specified');
            }
            apiKey.roles = roles;
        }
        if (permissions !== undefined) {
            // Handle both empty array (to clear permissions) and populated array
            apiKey.permissions = permissions;
        }
        await this.saveApiKey(apiKey);
        return apiKey;
    }

    /**
     * Ensures an API key exists, creating it if necessary.
     * Used by internal services like Connect and CLI for automatic key management.
     */
    public async ensureKey(config: {
        name: string;
        description: string;
        roles: Role[];
        legacyNames?: string[];
    }): Promise<string> {
        // Clean up any legacy keys
        if (config.legacyNames && config.legacyNames.length > 0) {
            const allKeys = await this.findAll();
            const legacyKeys = allKeys.filter((key) => config.legacyNames!.includes(key.name));
            if (legacyKeys.length > 0) {
                await this.deleteApiKeys(legacyKeys.map((key) => key.id));
                this.logger.log(`Deleted legacy API keys: ${config.legacyNames.join(', ')}`);
            }
        }

        // Check if key already exists
        const existingKey = this.findByField('name', config.name);
        if (existingKey) {
            return existingKey.key;
        }

        // Create new key
        const newApiKey = await this.getOrCreateLocalKey(config.name, config.description, config.roles);
        this.logger.log(`Created new API key: ${config.name}`);
        return newApiKey;
    }

    /**
     * Gets or creates a local API key with the specified name, description, and roles.
     */
    public async getOrCreateLocalKey(name: string, description: string, roles: Role[]): Promise<string> {
        try {
            const apiKey = await this.create({
                name,
                description,
                roles,
                overwrite: true,
            });

            if (!apiKey?.key) {
                throw new Error(`Failed to create local API key: ${name}`);
            }

            return apiKey.key;
        } catch (err) {
            this.logger.error(`Failed to create local API key ${name}: ${err}`);
            throw err;
        }
    }
}
