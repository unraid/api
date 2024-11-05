import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiKeyWithSecret, type ApiKey } from '@app/graphql/generated/api/types';
import { getters } from '@app/store';

@Injectable()
export class ApiKeyService {
    private readonly logger = new Logger(ApiKeyService.name);

    public paths() {
        const basePath = getters.paths()['auth-keys'];

        if (!fs.existsSync(basePath)) {
            this.logger.verbose(`Creating API key directory: ${basePath}`);
            fs.mkdirSync(basePath, { recursive: true });
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
        const apiKey: ApiKeyWithSecret = {
            id: uuidv4(),
            key: uuidv4(),
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
        let files: string[] = [];
        try {
            files = await fs.promises.readdir(this.paths().basePath);
        } catch (error) {
            this.logger.error(`Error reading API key directory: ${error}`);
            return [];
        }
        const apiKeys: ApiKey[] = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const content = await fs.promises.readFile(join(this.paths().basePath, file), 'utf8');
                    apiKeys.push(JSON.parse(content) as ApiKey);
                } catch (error) {
                    this.logger.error(`Error reading or parsing API key file ${file}: ${error}`);
                    continue;
                }
            }
        }

        return apiKeys;
    }

    async findById(id: string): Promise<ApiKey | null> {
        try {
            const content = await fs.promises.readFile(this.paths().keyFile(id), 'utf8');

            return JSON.parse(content) as ApiKey;
        } catch (error) {
            return null;
        }
    }

    async findByKey(key: string): Promise<ApiKey | null> {
        try {
            const files = await fs.promises.readdir(this.paths().basePath);

            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const content = await fs.promises.readFile(
                            join(this.paths().basePath, file),
                            'utf8'
                        );
                        const apiKey = JSON.parse(content) as ApiKey;

                        if (apiKey.key === key) {
                            return apiKey;
                        }
                    } catch (error) {
                        this.logger.warn(`Error reading API key file ${file}: ${error}`);
                        continue;
                    }
                }
            }

            return null;
        } catch (error) {
            this.logger.error(`Error reading API key directory: ${error}`);

            return null;
        }
    }

    public async saveApiKey(apiKey: ApiKey | ApiKeyWithSecret): Promise<void> {
        try {
            await fs.promises.writeFile(
                this.paths().keyFile(apiKey.id),
                JSON.stringify(apiKey, null, 2)
            );
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new InternalServerErrorException(`Failed to save API key: ${error.message}`);
            } else {
                throw new InternalServerErrorException('Failed to save API key: Unknown error');
            }
        }
    }
}
