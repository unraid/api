import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { ApiKey } from './api-key.entity';
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

    async create(name: string, description: string, roles: string[]): Promise<ApiKey> {
        const apiKey: ApiKey = {
            id: uuidv4(), // Just using UUIDs for now while testing
            key: uuidv4(), // TODO: Generate a key that is not a UUID
            name,
            description,
            roles,
            createdAt: new Date(),
        };

        await this.saveApiKey(apiKey);

        return apiKey;
    }

    async findAll(): Promise<ApiKey[]> {
        const files = await fs.promises.readdir(this.paths().basePath);
        const apiKeys: ApiKey[] = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.promises.readFile(join(this.paths().basePath, file), 'utf8');

                apiKeys.push(JSON.parse(content) as ApiKey);
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
        const files = await fs.promises.readdir(this.paths().basePath);

        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.promises.readFile(join(this.paths().basePath, file), 'utf8');
                const apiKey = JSON.parse(content) as ApiKey;

                if (apiKey.key === key) {
                    return apiKey;
                }
            }
        }
        return null;
    }

    public async saveApiKey(apiKey: ApiKey): Promise<void> {
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
