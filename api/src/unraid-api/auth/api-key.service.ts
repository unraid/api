import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { ApiKey } from './api-key.entity';

@Injectable()
export class ApiKeyService {
    private readonly baseDir = '/boot/config/plugins/dynamix.myservers/keys'; // flash drive location

    constructor() {
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    async create(name: string, description: string, roles: string[]): Promise<ApiKey> {
        const apiKey: ApiKey = {
            id: uuidv4(),
            key: uuidv4(),
            name,
            description,
            roles,
            createdAt: new Date(),
        };

        await this.saveApiKey(apiKey);

        return apiKey;
    }

    async findAll(): Promise<ApiKey[]> {
        const files = await fs.promises.readdir(this.baseDir);
        const apiKeys: ApiKey[] = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.promises.readFile(path.join(this.baseDir, file), 'utf8');

                apiKeys.push(JSON.parse(content) as ApiKey);
            }
        }

        return apiKeys;
    }

    async findById(id: string): Promise<ApiKey | null> {
        try {
            const content = await fs.promises.readFile(path.join(this.baseDir, `${id}.json`), 'utf8');

            return JSON.parse(content) as ApiKey;
        } catch (error) {
            return null;
        }
    }

    async findByKey(key: string): Promise<ApiKey | null> {
        const files = await fs.promises.readdir(this.baseDir);

        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.promises.readFile(path.join(this.baseDir, file), 'utf8');
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
            const filePath = path.join(this.baseDir, `${apiKey.id}.json`);

            await fs.promises.writeFile(filePath, JSON.stringify(apiKey, null, 2));
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new InternalServerErrorException(`Failed to save API key: ${error.message}`);
            } else {
                throw new InternalServerErrorException('Failed to save API key: Unknown error');
            }
        }
    }
}
