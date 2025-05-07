import { Injectable, Logger } from '@nestjs/common';

import { type Layout } from '@jsonforms/core';

import { buildRcloneConfigSchema } from '@app/unraid-api/graph/resolvers/rclone/jsonforms/rclone-jsonforms-config.js';
import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import {
    RCloneConfigFormInput,
    RCloneProviderOptionResponse,
} from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { DataSlice } from '@app/unraid-api/types/json-forms.js';

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
    async getFormSchemas(options: RCloneConfigFormInput): Promise<{
        dataSchema: { properties: DataSlice; type: 'object' };
        uiSchema: Layout;
    }> {
        const { providerType: selectedProvider = '', showAdvanced = false } = options;

        // Ensure provider info is loaded
        if (Object.keys(this.providerOptions).length === 0) {
            await this.loadProviderInfo();
        }

        return buildRcloneConfigSchema({
            providerTypes: this.providerNames,
            selectedProvider,
            providerOptions: this.providerOptions,
            showAdvanced,
        });
    }
}
