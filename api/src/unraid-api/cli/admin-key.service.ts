import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import crypto from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import type { ApiKeyService } from '@unraid/shared/services/api-key.js';
import { Role } from '@unraid/shared/graphql.model.js';
import { API_KEY_SERVICE_TOKEN } from '@unraid/shared/tokens.js';

/**
 * Service that creates and manages the ephemeral admin key used by CLI commands.
 * Generates a temporary key stored in /var/run that expires on restart.
 */
@Injectable()
export class AdminKeyService implements OnModuleInit {
    private readonly logger = new Logger(AdminKeyService.name);
    private ephemeralKey: string | null = null;
    private static readonly RUNTIME_KEY_PATH = '/var/run/unraid-api/cli.key';

    constructor(
        @Inject(API_KEY_SERVICE_TOKEN)
        private readonly apiKeyService: ApiKeyService
    ) {}

    async onModuleInit() {
        try {
            await this.generateEphemeralCliKey();
            this.logger.log('CLI ephemeral key initialized');
        } catch (error) {
            this.logger.error('Failed to initialize CLI ephemeral key:', error);
        }
    }

    /**
     * Generates an ephemeral key for CLI operations.
     * Writes the key to /var/run for the CLI process to read.
     */
    private async generateEphemeralCliKey(): Promise<void> {
        // Generate cryptographically secure key
        this.ephemeralKey = crypto.randomBytes(32).toString('hex');

        // Register in ApiKeyService memory store
        await this.apiKeyService.registerEphemeralKey({
            key: this.ephemeralKey,
            name: 'CLI-Runtime',
            roles: [Role.ADMIN],
            type: 'cli',
        });

        // Write to /var/run for CLI process
        const runDir = '/var/run/unraid-api';
        try {
            await mkdir(runDir, { recursive: true });
            await writeFile(
                AdminKeyService.RUNTIME_KEY_PATH,
                this.ephemeralKey,
                { mode: 0o600 } // Root only
            );
            this.logger.debug('CLI ephemeral key written to runtime directory');
        } catch (error) {
            // If we can't write to /var/run, it's okay - CLI will fall back to getting it from service
            this.logger.warn(`Could not write CLI key to ${AdminKeyService.RUNTIME_KEY_PATH}: ${error}`);
        }
    }

    /**
     * Gets the ephemeral admin key for CLI operations.
     * If not yet generated, creates it on-demand.
     */
    public async getOrCreateLocalAdminKey(): Promise<string> {
        if (!this.ephemeralKey) {
            await this.generateEphemeralCliKey();
        }

        if (!this.ephemeralKey) {
            throw new Error('Failed to generate CLI ephemeral key');
        }

        return this.ephemeralKey;
    }
}
