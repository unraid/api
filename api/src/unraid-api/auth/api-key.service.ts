import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import crypto from 'crypto';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import { watch } from 'chokidar';
import { ensureDirSync } from 'fs-extra';
import { GraphQLError } from 'graphql';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';

import { ApiKeySchema, ApiKeyWithSecretSchema } from '@app/graphql/generated/api/operations';
import { ApiKey, ApiKeyWithSecret, Role, UserAccount } from '@app/graphql/generated/api/types';
import { getters, store } from '@app/store';
import { updateUserConfig } from '@app/store/modules/config';
import { FileLoadStatus } from '@app/store/types';

@Injectable()
export class ApiKeyService implements OnModuleInit {
    private readonly logger = new Logger(ApiKeyService.name);
    protected readonly basePath: string;
    protected memoryApiKeys: Array<ApiKeyWithSecret> = [];
    private static readonly validRoles: Set<Role> = new Set(Object.values(Role));

    constructor() {
        this.basePath = getters.paths()['auth-keys'];
        ensureDirSync(this.basePath);
        this.setupWatch();
    }

    async onModuleInit() {
        try {
            this.memoryApiKeys = await this.loadAllFromDisk();
            await this.createLocalApiKeyForConnectIfNecessary();
        } catch (error) {
            this.logger.error('Failed to initialize API keys:', error);
            throw error;
        }
    }

    public findAll(): ApiKey[] {
        return this.memoryApiKeys.map((key) => ApiKeySchema().parse(key));
    }

    private setupWatch() {
        watch(this.basePath, { ignoreInitial: false }).on('change', async (event, path) => {
            this.logger.debug(`API key storage event: ${event} on ${path}`);
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

    async create(
        name: string,
        description: string | undefined,
        roles: Role[],
        overwrite: boolean = false
    ): Promise<ApiKeyWithSecret> {
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

        const existingKey = await this.findByField('name', sanitizedName);
        if (!overwrite && existingKey) {
            throw new GraphQLError('API key name already exists, use overwrite flag to update');
        }
        const apiKey: Partial<ApiKeyWithSecret> = {
            id: uuidv4(),
            key: this.generateApiKey(),
            name: sanitizedName,
            ...(existingKey ?? {}),
        };

        apiKey.description = description;
        apiKey.roles = roles;
        apiKey.permissions = [];
        // Update createdAt date
        apiKey.createdAt = new Date().toISOString();

        await this.saveApiKey(apiKey as ApiKeyWithSecret);

        return apiKey as ApiKeyWithSecret;
    }

    private async createLocalApiKeyForConnectIfNecessary() {
        if (getters.config().status !== FileLoadStatus.LOADED) {
            this.logger.error('Config file not loaded, cannot create local API key');

            return;
        }

        const { remote } = getters.config();
        // If the remote API Key is set and the local key is either not set or not found on disk, create a key
        if (remote.apikey && (!remote.localApiKey || !(await this.findByKey(remote.localApiKey)))) {
            const hasExistingKey = this.findByField('name', 'Connect');

            if (hasExistingKey) {
                return;
            }
            // Create local API key
            const localApiKey = await this.create(
                'Connect',
                'API key for Connect user',
                [Role.CONNECT],
                true
            );

            if (localApiKey?.key) {
                store.dispatch(
                    updateUserConfig({
                        remote: {
                            localApiKey: localApiKey.key,
                        },
                    })
                );
            } else {
                this.logger.error('Failed to create local API key - no key returned');
                throw new Error('Failed to create local API key');
            }
        }
    }

    async loadAllFromDisk(): Promise<ApiKeyWithSecret[]> {
        try {
            const files = await readdir(this.basePath);
            const apiKeys: ApiKeyWithSecret[] = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const content = await readFile(join(this.basePath, file), 'utf8');
                        const apiKey = ApiKeyWithSecretSchema().parse(JSON.parse(content));

                        apiKeys.push(apiKey);
                    } catch (error) {
                        if (error instanceof SyntaxError) {
                            throw new Error('Authentication system error: Corrupted key file');
                        }
                        if (error instanceof ZodError) {
                            this.logger.error(`Invalid API key structure in file ${file}`, error.errors);
                            throw new Error('Invalid API key structure');
                        }
                        this.logger.warn(`Error reading API key file ${file}: ${error}`);
                    }
                }
            }
            return apiKeys;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            this.logger.error(`Failed to read API key directory: ${error}`);
            throw new Error('Failed to list API keys');
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

        try {
            return this.memoryApiKeys.find((key) => key[field] === value) ?? null;
        } catch (error) {
            if (error instanceof GraphQLError) {
                throw error;
            }

            this.logger.error(`Failed to read API key storage: ${error}`);
            throw new GraphQLError('Authentication system unavailable - please see logs');
        }
    }

    async findByKey(key: string): Promise<ApiKeyWithSecret | null> {
        return this.findByField('key', key);
    }

    async findOneByKey(apiKey: string): Promise<UserAccount | null> {
        try {
            const key = await this.findByKey(apiKey);

            if (!key) {
                throw new GraphQLError('API key not found');
            }

            return {
                id: key.id,
                description: key.description ?? `API Key ${key.name}`,
                name: key.name,
                roles: key.roles,
            };
        } catch (error) {
            this.logger.error(`Error finding user by key: ${error}`);

            if (error instanceof GraphQLError) {
                throw error;
            }

            throw new GraphQLError('Failed to retrieve user account');
        }
    }

    private generateApiKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    public async createLocalConnectApiKey(): Promise<ApiKeyWithSecret> {
        return await this.create('Connect', 'API key for Connect user', [Role.CONNECT], true);
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
