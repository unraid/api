import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import type { ApiKeyService } from '@unraid/shared/services/api-key.js';
import { Role } from '@unraid/shared/graphql.model.js';
import { API_KEY_SERVICE_TOKEN } from '@unraid/shared/tokens.js';

/**
 * Service that creates and manages the admin API key used by CLI commands.
 * Uses the standard API key storage location via helper methods in ApiKeyService.
 */
@Injectable()
export class AdminKeyService implements OnModuleInit {
    private readonly logger = new Logger(AdminKeyService.name);
    private static readonly ADMIN_KEY_NAME = 'CliInternal';
    private static readonly ADMIN_KEY_DESCRIPTION =
        'Internal admin API key used by CLI commands for system operations';

    constructor(
        @Inject(API_KEY_SERVICE_TOKEN)
        private readonly apiKeyService: ApiKeyService
    ) {}

    async onModuleInit() {
        try {
            await this.getOrCreateLocalAdminKey();
            this.logger.log('Admin API key initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize admin API key:', error);
        }
    }

    /**
     * Gets or creates a local admin API key for CLI operations.
     * Uses the standard API key storage location.
     */
    public async getOrCreateLocalAdminKey(): Promise<string> {
        return this.apiKeyService.ensureKey({
            name: AdminKeyService.ADMIN_KEY_NAME,
            description: AdminKeyService.ADMIN_KEY_DESCRIPTION,
            roles: [Role.ADMIN], // Full admin privileges for CLI operations
            legacyNames: ['CLI', 'Internal', 'CliAdmin'], // Clean up old keys
        });
    }
}
