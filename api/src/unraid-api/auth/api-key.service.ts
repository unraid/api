import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import crypto from 'crypto';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import { ensureDir } from 'fs-extra';
import { GraphQLError } from 'graphql';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';

import { ApiKeySchema, ApiKeyWithSecretSchema } from '@app/graphql/generated/api/operations';
import { ApiKey, ApiKeyWithSecret, Role, UserAccount } from '@app/graphql/generated/api/types';
import { getters } from '@app/store';

@Injectable()
export class ApiKeyService implements OnModuleInit {
    private readonly logger = new Logger(ApiKeyService.name);
    protected readonly basePath: string;
    protected readonly keyFile: (id: string) => string;
    protected memoryApiKeys = new Map<string, ApiKeyWithSecret>();
    private static readonly validRoles: Set<Role> = new Set(Object.values(Role));

    constructor() {
        this.basePath = getters.paths()['auth-keys'];
        this.keyFile = (id: string) => join(this.basePath, `${id}.json`);
    }

    public async initialize(): Promise<void> {
        this.logger.verbose(`Ensuring API key directory exists: ${this.basePath}`);

        try {
            await ensureDir(this.basePath);
        } catch (error) {
            this.logger.error(`Failed to create API key directory: ${error}`);
            throw new GraphQLError('Failed to initialize API key storage');
        }
        this.logger.verbose(`Using API key base path: ${this.basePath}`);

        // @todo setup file watch to reload keys
    }

    async onModuleInit() {
        await this.initialize();
    }

    private sanitizeName(name: string): string {
        if (/^[\p{L}\p{N} ]+$/u.test(name)) {
            return name;
        } else {
            throw new GraphQLError('API key name must be alphanumeric + spaces');
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
        // Update createdAt date
        apiKey.createdAt = new Date().toISOString();

        await this.saveApiKey(apiKey as ApiKeyWithSecret);

        return apiKey as ApiKeyWithSecret;
    }

    async findAll(): Promise<ApiKey[]> {
        try {
            const files = await readdir(this.basePath);
            const apiKeys: ApiKey[] = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const content = await readFile(join(this.basePath, file), 'utf8');
                        const apiKey = ApiKeySchema().parse(JSON.parse(content));

                        apiKeys.push(apiKey);
                    } catch (error) {
                        if (error instanceof ZodError) {
                            this.logger.error(`Invalid API key structure in file ${file}`, error.errors);

                            continue;
                        }
                        this.logger.warn(`Error reading API key file ${file}: ${error}`);
                    }
                }
            }

            return apiKeys;
        } catch (error) {
            this.logger.error(`Failed to read API key directory: ${error}`);
            throw new GraphQLError('Failed to list API keys');
        }
    }

    async findById(id: string): Promise<ApiKey | null> {
        try {
            const content = await readFile(this.keyFile(id), 'utf8');

            try {
                const apiKey = ApiKeySchema().parse(JSON.parse(content));

                return apiKey;
            } catch (error) {
                if (error instanceof ZodError) {
                    this.logger.error(`Invalid API key structure for ID ${id}`, error.errors);
                    throw new GraphQLError('Invalid API key data structure');
                }

                throw error;
            }
        } catch (error: unknown) {
            if (error instanceof GraphQLError) {
                throw error;
            }
            if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
                this.logger.warn(`API key file not found for ID ${id}`);

                return null;
            } else {
                this.logger.error(`Error reading API key file for ID ${id}: ${error}`);
                throw new GraphQLError(
                    `Failed to read API key: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }
    }

    public async findByIdWithSecret(id: string): Promise<ApiKeyWithSecret | null> {
        try {
            const content = await readFile(this.keyFile(id), 'utf8');
            const apiKey = JSON.parse(content);

            return ApiKeyWithSecretSchema().parse(apiKey);
        } catch (error) {
            if (error instanceof ZodError) {
                this.logger.error('Invalid API key data structure', error);
                throw new GraphQLError('Invalid API key data structure');
            }

            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return null;
            }

            this.logger.error('Failed to read API key file', error);
            throw new GraphQLError('Failed to read API key file');
        }
    }

    async findByField(field: keyof ApiKeyWithSecret, value: string): Promise<ApiKeyWithSecret | null> {
        if (!value) return null;

        try {
            const files = await readdir(this.basePath);

            for (const file of files ?? []) {
                if (!file.endsWith('.json')) continue;

                try {
                    const content = await readFile(join(this.basePath, file), 'utf8');
                    let parsedContent;

                    try {
                        parsedContent = JSON.parse(content);
                    } catch (error) {
                        if (error instanceof SyntaxError) {
                            throw new GraphQLError('Authentication system error: Corrupted key file');
                        }

                        throw error;
                    }

                    const apiKey = ApiKeyWithSecretSchema().parse(parsedContent);

                    if (field === 'key') {
                        if (crypto.timingSafeEqual(Buffer.from(apiKey[field]), Buffer.from(value))) {
                            apiKey.roles = apiKey.roles.map((role) => role || Role.GUEST);
                            return apiKey;
                        }
                    } else if (apiKey[field] === value) {
                        apiKey.roles = apiKey.roles.map((role) => role || Role.GUEST);
                        return apiKey;
                    }
                } catch (error) {
                    if (error instanceof GraphQLError) {
                        throw error;
                    }

                    this.logger.error(`Error processing API key file ${file}: ${error}`);
                }
            }

            return null;
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

            await writeFile(this.keyFile(validatedApiKey.id), JSON.stringify(sortedApiKey, null, 2));
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
            keyFile: this.keyFile,
        };
    }
}
