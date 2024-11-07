import { Injectable, Logger } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { access, mkdir, readdir, readFile, writeFile } from 'fs/promises';
import crypto from 'crypto';

import { ApiKeyWithSecret, type ApiKey } from '@app/graphql/generated/api/types';
import { getters } from '@app/store';

@Injectable()
export class ApiKeyService {
    private readonly logger = new Logger(ApiKeyService.name);

    public async paths() {
        const basePath = getters.paths()['auth-keys'];

        try {
            await access(basePath);
        } catch {
            this.logger.verbose(`Creating API key directory: ${basePath}`);
            await mkdir(basePath, { recursive: true });
        }

        this.logger.verbose(`Using API key base path: ${basePath}`);

        return {
            basePath,
            keyFile: (id: string) => join(basePath, `${id}.json`),
        };
    }

    async create(
        name: string,
        description: string | undefined,
        roles: string[]
    ): Promise<ApiKeyWithSecret> {
        if (!name?.trim()) {
            throw new GraphQLError('API key name is required');
        }

        if (!roles?.length) {
            throw new GraphQLError('At least one role must be specified');
        }

        const apiKey: ApiKeyWithSecret = {
            id: uuidv4(),
            key: this.generateApiKey(),
            name,
            description,
            roles,
            createdAt: new Date().toISOString(),
            lastUsed: null,
        };

        await this.saveApiKey(apiKey);

        return apiKey;
    }

    async findAll(): Promise<ApiKey[]> {
        const { basePath } = await this.paths();
        let files: string[];

        try {
            files = await readdir(basePath);
        } catch (error) {
            this.logger.error(`Failed to read API key directory: ${error}`);
            throw new GraphQLError('Failed to list API keys');
        }

        const apiKeys: ApiKey[] = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const content = await readFile(join(basePath, file), 'utf8');

                    apiKeys.push(JSON.parse(content) as ApiKey);
                } catch (error) {
                    this.logger.warn(`Error reading API key file ${file}: ${error}`);
                }
            }
        }

        return apiKeys;
    }

    async findById(id: string): Promise<ApiKey | null> {
        try {
            const { keyFile } = await this.paths();
            const content = await readFile(keyFile(id), 'utf8');

            return JSON.parse(content) as ApiKey;
        } catch (error: unknown) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                return null;
            } else {
                this.logger.error(`Error reading API key file for ID ${id}: ${error}`);
                throw new GraphQLError(`Failed to read API key: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    async findByKey(key: string): Promise<ApiKeyWithSecret | null> {
        try {
            const { basePath } = await this.paths();
            const files = await readdir(basePath);

            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const content = await readFile(join(basePath, file), 'utf8');
                        const apiKey = JSON.parse(content) as ApiKeyWithSecret;

                        if (apiKey.key === key) {
                            return apiKey;
                        }
                    } catch (error) {
                        this.logger.warn(`Error reading API key file ${file}: ${error}`);
                    }
                }
            }

            return null;
        } catch (error) {
            this.logger.error(`Error reading API key directory: ${error}`);

            return null;
        }
    }

    private generateApiKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    public async saveApiKey(apiKey: ApiKey | ApiKeyWithSecret): Promise<void> {
        try {
            const { keyFile } = await this.paths();

            await writeFile(keyFile(apiKey.id), JSON.stringify(apiKey, null, 2));
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new GraphQLError(`Failed to save API key: ${error.message}`);
            } else {
                throw new GraphQLError('Failed to save API key: Unknown error');
            }
        }
    }
}
