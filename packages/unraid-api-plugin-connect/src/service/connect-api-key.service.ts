import { Inject, Injectable, Logger } from '@nestjs/common';

import { ApiKey, ApiKeyWithSecret, Permission, Role } from '@unraid/shared/graphql.model.js';
import { ApiKeyService } from '@unraid/shared/services/api-key.js';
import { API_KEY_SERVICE_TOKEN } from '@unraid/shared/tokens.js';
import { AuthActionVerb } from 'nest-authz';

@Injectable()
export class ConnectApiKeyService implements ApiKeyService {
    private readonly logger = new Logger(ConnectApiKeyService.name);
    private static readonly CONNECT_API_KEY_NAME = 'ConnectInternal';
    private static readonly CONNECT_API_KEY_DESCRIPTION =
        'Internal API Key Used By Unraid Connect to access your server resources for the connect.myunraid.net dashboard';

    constructor(
        @Inject(API_KEY_SERVICE_TOKEN)
        private readonly apiKeyService: ApiKeyService,
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
                description: ConnectApiKeyService.CONNECT_API_KEY_DESCRIPTION,
                roles: [Role.CONNECT],
                overwrite: true,
            });
        } catch (err) {
            this.logger.error(`Failed to create local API key for Connect user: ${err}`);
            return null;
        }
    }

    /**
     * Gets or creates a local API key for Connect
     */
    public async getOrCreateLocalApiKey(): Promise<string> {
        const allKeys = await this.findAll();

        const legacyConnectKeys = allKeys.filter((key) => key.name === 'Connect');
        if (legacyConnectKeys.length > 0) {
            await this.deleteApiKeys(legacyConnectKeys.map((key) => key.id));
            this.logger.log(`Deleted legacy Connect API keys`);
        }

        const connectKey = this.findByField('name', ConnectApiKeyService.CONNECT_API_KEY_NAME);
        if (connectKey) {
            return connectKey.key;
        }

        const localApiKey = await this.createLocalConnectApiKey();

        if (!localApiKey?.key) {
            throw new Error('Failed to create local API key');
        }

        return localApiKey.key;
    }
}
