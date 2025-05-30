import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiKey, ApiKeyWithSecret, Permission, Resource, Role } from '@unraid/shared/graphql.model.js';
import { ApiKeyService } from '@unraid/shared/services/api-key.js';
import { API_KEY_SERVICE_TOKEN } from '@unraid/shared/tokens';
import { AuthActionVerb } from 'nest-authz';

@Injectable()
export class ConnectApiKeyService implements ApiKeyService {
    private readonly logger = new Logger(ConnectApiKeyService.name);
    private static readonly validRoles: Set<Role> = new Set(Object.values(Role));

    constructor(
        @Inject(API_KEY_SERVICE_TOKEN)
        private readonly apiKeyService: ApiKeyService,
        private readonly configService: ConfigService
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

    /**
     * Gets or creates a local API key for Connect
     */
    public async getOrCreateLocalApiKey(): Promise<string> {
        const { localApiKey: localApiKeyFromConfig } = this.configService.get('connect.config');
        if (localApiKeyFromConfig === '') {
            const localApiKey = await this.createLocalConnectApiKey();
            if (!localApiKey?.key) {
                throw new Error('Failed to create local API key');
            }
            return localApiKey.key;
        }
        return localApiKeyFromConfig;
    }
}
