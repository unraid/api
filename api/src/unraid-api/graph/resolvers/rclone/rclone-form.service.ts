import { Injectable, Logger } from '@nestjs/common';

import { type Layout } from '@jsonforms/core';

import { RCloneProviderOptionResponse } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';

import { buildRcloneConfigSchema, getRcloneConfigSchemas } from './jsonforms/rclone-jsonforms-config.js';
import { RCloneApiService } from './rclone-api.service.js';

/**
 * Service responsible for generating form UI schemas and form logic
 */
@Injectable()
export class RCloneFormService {
    private readonly logger = new Logger(RCloneFormService.name);
    private providerNames: string[] = [];
    private providerOptions: Record<string, RCloneProviderOptionResponse[]> = {};

    constructor(private readonly rcloneApiService: RCloneApiService) {}

    /**
     * Loads RClone provider types and options
     */
    private async loadProviderInfo(): Promise<void> {
        try {
            const providersResponse = await this.rcloneApiService.getProviders();
            if (providersResponse) {
                // Extract provider types
                this.providerNames = providersResponse.map((provider) => provider.Name);
                this.providerOptions = providersResponse.reduce((acc, provider) => {
                    acc[provider.Name] = provider.Options;
                    return acc;
                }, {});
                this.logger.debug(`Loaded ${this.providerNames.length} provider types`);
            }
        } catch (error) {
            this.logger.error(`Error loading provider information: ${error}`);
            throw error;
        }
    }

    /**
     * Returns both data schema and UI schema for the form
     */
    async getFormSchemas(selectedProvider: string = ''): Promise<{
        dataSchema: Record<string, any>;
        uiSchema: Layout;
    }> {
        // Ensure provider info is loaded
        if (Object.keys(this.providerOptions).length === 0) {
            await this.loadProviderInfo();
        }

        const { properties, elements } = buildRcloneConfigSchema({
            providerTypes: this.providerNames,
            selectedProvider,
            providerOptions: this.providerOptions,
        });

        return getRcloneConfigSchemas(properties, elements);
    }
}
