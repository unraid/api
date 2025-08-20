import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { ApiKey, AuthAction, Permission, Resource, Role } from '@unraid/shared/graphql.model.js';
import { ApiKeyService, CreatePermissionsInput } from '@unraid/shared/services/api-key.js';
import { API_KEY_SERVICE_TOKEN } from '@unraid/shared/tokens.js';

@Injectable()
export class ConnectApiKeyService implements ApiKeyService, OnModuleInit {
    private readonly logger = new Logger(ConnectApiKeyService.name);
    private moduleToken: string | null = null;

    constructor(
        @Inject(API_KEY_SERVICE_TOKEN)
        private readonly apiKeyService: ApiKeyService
    ) {}
    
    async onModuleInit() {
        try {
            // Register module and get secure token
            this.moduleToken = await this.apiKeyService.registerModule('connect', [Role.CONNECT]);
            this.logger.log('Connect module registered with ephemeral token');
        } catch (error) {
            this.logger.error('Failed to register Connect module:', error);
        }
    }

    // Delegate all standard ApiKeyService methods to the injected service
    async findById(id: string): Promise<ApiKey | null> {
        return this.apiKeyService.findById(id);
    }

    findByIdWithSecret(id: string): ApiKey | null {
        return this.apiKeyService.findByIdWithSecret(id);
    }

    findByField(field: keyof ApiKey, value: string): ApiKey | null {
        return this.apiKeyService.findByField(field, value);
    }

    findByKey(key: string): ApiKey | null {
        return this.apiKeyService.findByKey(key);
    }

    async create(input: {
        name: string;
        description?: string;
        roles?: Role[];
        permissions?: CreatePermissionsInput;
        overwrite?: boolean;
    }): Promise<ApiKey> {
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
     * @deprecated Use module tokens instead
     */
    public async createLocalConnectApiKey(): Promise<ApiKey | null> {
        // Return a mock key for backwards compatibility
        return {
            id: 'module-connect',
            key: this.moduleToken || '',
            name: 'Module-Connect',
            description: 'Ephemeral token for Connect module',
            roles: [Role.CONNECT],
            permissions: [],
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Gets the ephemeral module token for Connect.
     * If not yet generated, creates it on-demand.
     */
    public async getOrCreateLocalApiKey(): Promise<string> {
        if (!this.moduleToken) {
            this.moduleToken = await this.apiKeyService.registerModule('connect', [Role.CONNECT]);
        }
        
        if (!this.moduleToken) {
            throw new Error('Failed to generate Connect module token');
        }
        
        return this.moduleToken;
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
