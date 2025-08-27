import { Inject, Injectable, Logger } from '@nestjs/common';

import { ApiKey, ApiKeyWithSecret, AuthAction, Permission, Role } from '@unraid/shared/graphql.model.js';
import { ApiKeyService } from '@unraid/shared/services/api-key.js';
import { API_KEY_SERVICE_TOKEN } from '@unraid/shared/tokens.js';

@Injectable()
export class ConnectApiKeyService implements ApiKeyService {
    private readonly logger = new Logger(ConnectApiKeyService.name);
    private static readonly CONNECT_API_KEY_NAME = 'ConnectInternal';
    private static readonly CONNECT_API_KEY_DESCRIPTION =
        'Internal API Key Used By Unraid Connect to access your server resources for the connect.myunraid.net dashboard';

    constructor(
        @Inject(API_KEY_SERVICE_TOKEN)
        private readonly apiKeyService: ApiKeyService
    ) {}

    // Delegate all standard ApiKeyService methods to the injected service
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
        permissions?: Permission[] | { resource: string; actions: AuthAction[] }[];
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
        return this.ensureKey({
            name: ConnectApiKeyService.CONNECT_API_KEY_NAME,
            description: ConnectApiKeyService.CONNECT_API_KEY_DESCRIPTION,
            roles: [Role.CONNECT],
            legacyNames: ['Connect'],
        });
    }

    async ensureKey(config: {
        name: string;
        description: string;
        roles: Role[];
        legacyNames?: string[];
    }): Promise<string> {
        return this.apiKeyService.ensureKey(config);
    }

    async getOrCreateLocalKey(name: string, description: string, roles: Role[]): Promise<string> {
        return this.apiKeyService.getOrCreateLocalKey(name, description, roles);
    }
}
