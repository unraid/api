import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiKey, ApiKeyWithSecret, Permission, Resource, Role } from '@unraid/shared/graphql.model.js';
import { ApiKeyService } from '@unraid/shared/services/api-key.js';
import { API_KEY_SERVICE_TOKEN } from '@unraid/shared/tokens.js';
import { AuthActionVerb } from 'nest-authz';

import { ConnectConfigService } from './connect-config.service.js';

@Injectable()
export class ConnectApiKeyService implements ApiKeyService {
    private readonly logger = new Logger(ConnectApiKeyService.name);
    private static readonly validRoles: Set<Role> = new Set(Object.values(Role));
    private static readonly CONNECT_API_KEY_NAME = 'Connect';
    private static readonly CONNECT_API_KEY_DESCRIPTION = 'Internal API Key Used By Unraid Connect to access your server resources for the connect.myunraid.net dashboard';

    constructor(
        @Inject(API_KEY_SERVICE_TOKEN)
        private readonly apiKeyService: ApiKeyService,
        private readonly configService: ConfigService,
        private readonly connectConfig: ConnectConfigService
    ) {}

    async findById(id: string): Promise<ApiKey | null> {
        return this.apiKeyService.findById(id);
    }

    findByIdWithSecret(id: string): ApiKeyWithSecret | null {
        return this.apiKeyService.findByIdWithSecret(id);
    }

    findByField(field: keyof ApiKeyWithSecret, value: string): ApiKeyWithSecret | null {
        return this.apiKeyService.findByField(field, value);
    }

    findByKey(key: string): ApiKeyWithSecret | null {
        return this.apiKeyService.findByKey(key);
    }

    async create(input: {
        name: string;
        description?: string;
        roles?: Role[];
        permissions?: Permission[] | { resource: string; actions: AuthActionVerb[] }[];
        overwrite?: boolean;
    }): Promise<ApiKeyWithSecret> {
        return this.apiKeyService.create(input);
    }

    getAllValidPermissions(): Permission[] {
        return this.apiKeyService.getAllValidPermissions();
    }

    convertPermissionsStringArrayToPermissions(permissions: string[]): Permission[] {
        return this.apiKeyService.convertPermissionsStringArrayToPermissions(permissions);
    }

    convertRolesStringArrayToRoles(roles: string[]): Role[] {
        return this.apiKeyService.convertRolesStringArrayToRoles(roles);
    }

    async deleteApiKeys(ids: string[]): Promise<void> {
        return this.apiKeyService.deleteApiKeys(ids);
    }

    async findAll(): Promise<ApiKey[]> {
        return this.apiKeyService.findAll();
    }

    /**
     * Creates a local API key specifically for Connect
     */
    public async createLocalConnectApiKey(): Promise<ApiKeyWithSecret | null> {
        try {
            return await this.create({
                name: ConnectApiKeyService.CONNECT_API_KEY_NAME,
                description: 'API key for Connect user',
                roles: [Role.CONNECT],
                overwrite: true,
            });

            // Delete all other API keys with the role CONNECT
        } catch (err) {
            this.logger.error(`Failed to create local API key for Connect user: ${err}`);
            return null;
        }
    }

    /**
     * Gets or creates a local API key for Connect
     */
    public async getOrCreateLocalApiKey(): Promise<string> {
        const targetDescription = ConnectApiKeyService.CONNECT_API_KEY_DESCRIPTION;
        
        // 1. Get all API keys first
        const allKeys = await this.findAll();
        
        // 2. Check in-memory config and verify key exists
        const { localApiKey: localApiKeyFromConfig } = this.connectConfig.getConfig();
        if (localApiKeyFromConfig && localApiKeyFromConfig !== '') {
            const keyExists = allKeys.some(key => {
                const keyWithSecret = this.findByIdWithSecret(key.id);
                return keyWithSecret?.key === localApiKeyFromConfig;
            });
            if (keyExists) {
                return localApiKeyFromConfig;
            }
        }
        
        // 3. Filter by name "Connect"
        const connectKeys = allKeys.filter(key => key.name === ConnectApiKeyService.CONNECT_API_KEY_NAME);
        
        // 4. Find keys with correct description vs incorrect description
        const correctKeys = connectKeys.filter(key => key.description === targetDescription);
        const incorrectKeys = connectKeys.filter(key => key.description !== targetDescription);
        
        // 5. Delete keys with incorrect description
        if (incorrectKeys.length > 0) {
            const idsToDelete = incorrectKeys.map(key => key.id);
            await this.deleteApiKeys(idsToDelete);
            this.logger.log(`Deleted ${incorrectKeys.length} Connect API keys with incorrect descriptions`);
        }
        
        // 6. If we have a correct key, return it
        if (correctKeys.length > 0) {
            const correctKeyWithSecret = this.findByIdWithSecret(correctKeys[0].id);
            if (correctKeyWithSecret) {
                return correctKeyWithSecret.key;
            }
        }
        
        // 7. Create a new key with the correct description
        const localApiKey = await this.create({
            name: ConnectApiKeyService.CONNECT_API_KEY_NAME,
            description: targetDescription,
            roles: [Role.CONNECT],
            overwrite: true,
        });
        
        if (!localApiKey?.key) {
            throw new Error('Failed to create local API key');
        }
        
        return localApiKey.key;
    }
}
