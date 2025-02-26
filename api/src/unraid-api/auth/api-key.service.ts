import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import crypto from 'crypto';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import { watch } from 'chokidar';
import { ensureDirSync } from 'fs-extra';
import { GraphQLError } from 'graphql';
import { AuthActionVerb } from 'nest-authz';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';

import { environment } from '@app/environment.js';
import { ApiKeySchema, ApiKeyWithSecretSchema } from '@app/graphql/generated/api/operations.js';
import {
    AddPermissionInput,
    ApiKey,
    ApiKeyWithSecret,
    Permission,
    Resource,
    Role,
} from '@app/graphql/generated/api/types.js';
import { getters, store } from '@app/store/index.js';
import { setLocalApiKey } from '@app/store/modules/config.js';
import { FileLoadStatus } from '@app/store/types.js';

@Injectable()
export class ApiKeyService implements OnModuleInit {
    private readonly logger = new Logger(ApiKeyService.name);
    protected readonly basePath: string;
    protected memoryApiKeys: Array<ApiKeyWithSecret> = [];
    private static readonly validRoles: Set<Role> = new Set(Object.values(Role));

    constructor() {
        this.basePath = getters.paths()['auth-keys'];
        ensureDirSync(this.basePath);
    }

    async onModuleInit() {
        this.memoryApiKeys = await this.loadAllFromDisk();
        if (environment.IS_MAIN_PROCESS) {
            await this.createLocalApiKeyForConnectIfNecessary();
            this.setupWatch();
        }
    }

    public findAll(): ApiKey[] {
        return this.memoryApiKeys.map((key) => ApiKeySchema().parse(key));
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
            actions: Object.values(AuthActionVerb),
        }));
    }

    public convertPermissionsStringArrayToPermissions(permissions: string[]): Permission[] {
        return permissions.reduce<Array<Permission>>((acc, permission) => {
            const [resource, action] = permission.split(':');
            const validatedResource = Resource[resource.toUpperCase() as keyof typeof Resource] ?? null;
            const validatedAction =
                AuthActionVerb[action.toUpperCase() as keyof typeof AuthActionVerb] ?? null;
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
        return roles
            .map((roleStr) => Role[roleStr.trim().toUpperCase() as keyof typeof Role])
            .filter(Boolean);
    }

    async create({
        name,
        description,
        roles,
        permissions,
        overwrite = false,
    }: {
        name: string;
        description: string | undefined;
        roles?: Role[];
        permissions?: Permission[] | AddPermissionInput[];
        overwrite?: boolean;
    }): Promise<ApiKeyWithSecret> {
        const trimmedName = name?.trim();
        const sanitizedName = this.sanitizeName(trimmedName);

        if (!trimmedName) {
            throw new GraphQLError('API key name is required');
        }

        if (!roles?.length) {
            throw new GraphQLError('At least one role must be specified');
        }

        if (roles.some((role) => !ApiKeyService.validRoles.has(role))) {
            throw new GraphQLError('Invalid role specified');
        }

        const existingKey = this.findByField('name', sanitizedName);
        if (!overwrite && existingKey) {
            return existingKey;
        }
        const apiKey: Partial<ApiKeyWithSecret> = {
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

        await this.saveApiKey(apiKey as ApiKeyWithSecret);

        return apiKey as ApiKeyWithSecret;
    }

    private async createLocalApiKeyForConnectIfNecessary(): Promise<void> {
        if (!environment.IS_MAIN_PROCESS) {
            return;
        }
        const { remote, status } = getters.config();

        if (status !== FileLoadStatus.LOADED) {
            this.logger.error('Config file not loaded, cannot create local API key');
            return;
        }
        if (!remote.apikey) {
            return;
        }

        // If the remote API Key is set and the local key is either not set or not found on disk, create a key
        if (!remote.localApiKey || !this.findByKey(remote.localApiKey)) {
            const existingKey = this.findByField('name', 'Connect');

            if (existingKey) {
                this.logger.debug('Found existing Connect key, not set in config, setting');
                store.dispatch(setLocalApiKey(existingKey.key));
            } else {
                this.logger.debug('Creating a new key for Connect');

                // Create local API key
                const localApiKey = await this.createLocalConnectApiKey();

                if (localApiKey?.key) {
                    store.dispatch(setLocalApiKey(localApiKey.key));
                } else {
                    this.logger.error('Failed to create local API key - no key returned');
                }
            }
        }
    }

    async loadAllFromDisk(): Promise<ApiKeyWithSecret[]> {
        const files = await readdir(this.basePath).catch((error) => {
            this.logger.error(`Failed to read API key directory: ${error}`);
            throw new Error('Failed to list API keys');
        });

        const apiKeys: ApiKeyWithSecret[] = [];
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

    private async loadApiKeyFile(file: string): Promise<ApiKeyWithSecret | null> {
        try {
            const content = await readFile(join(this.basePath, file), 'utf8');

            return ApiKeyWithSecretSchema().parse(JSON.parse(content));
        } catch (error) {
            if (error instanceof SyntaxError) {
                this.logger.error(`Corrupted key file: ${file}`);
                throw new Error('Authentication system error: Corrupted key file');
            }

            if (error instanceof ZodError) {
                this.logger.error(`Invalid API key structure in file ${file}`, error.errors);
                throw new Error('Invalid API key structure');
            }

            this.logger.warn(`Error reading API key file ${file}: ${error}`);

            return null;
        }
    }

    findById(id: string): ApiKey | null {
        try {
            const key = this.findByField('id', id);

            if (key) {
                return ApiKeySchema().parse(key);
            }
            return null;
        } catch (error) {
            if (error instanceof ZodError) {
                this.logger.error('Invalid API key structure', error.errors);
                throw new Error('Invalid API key structure');
            }
            throw error;
        }
    }

    public findByIdWithSecret(id: string): ApiKeyWithSecret | null {
        return this.findByField('id', id);
    }

    public findByField(field: keyof ApiKeyWithSecret, value: string): ApiKeyWithSecret | null {
        if (!value) return null;

        return this.memoryApiKeys.find((k) => k[field] === value) ?? null;
    }

    findByKey(key: string): ApiKeyWithSecret | null {
        return this.findByField('key', key);
    }

    private generateApiKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    public async createLocalConnectApiKey(): Promise<ApiKeyWithSecret | null> {
        try {
            return await this.create({
                name: 'Connect',
                description: 'API key for Connect user',
                roles: [Role.CONNECT],
                overwrite: true,
            });
        } catch (err) {
            this.logger.error(`Failed to create local API key for Connect user: ${err}`);
            return null;
        }
    }

    public async saveApiKey(apiKey: ApiKeyWithSecret): Promise<void> {
        try {
            const validatedApiKey = ApiKeyWithSecretSchema().parse(apiKey);

            const sortedApiKey = Object.keys(validatedApiKey)
                .sort()
                .reduce((acc, key) => {
                    acc[key] = validatedApiKey[key];
                    return acc;
                }, {} as ApiKeyWithSecret);

            await writeFile(
                join(this.basePath, `${validatedApiKey.id}.json`),
                JSON.stringify(sortedApiKey, null, 2)
            );
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                this.logger.error('Invalid API key structure', error.errors);
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
}
