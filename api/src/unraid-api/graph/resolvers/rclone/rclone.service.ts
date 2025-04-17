import { Injectable, Logger } from '@nestjs/common';

import { type Layout } from '@jsonforms/core';

import type { SettingSlice } from '@app/unraid-api/types/json-forms.js';
import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import { RCloneFormService } from '@app/unraid-api/graph/resolvers/rclone/rclone-form.service.js';

/**
 * Types for rclone backup configuration UI
 */
export interface RcloneBackupConfigValues {
    configStep: number;
    showAdvanced: boolean;
    name?: string;
    type?: string;
    parameters?: Record<string, unknown>;
}

@Injectable()
export class RCloneService {
    private readonly logger = new Logger(RCloneService.name);
    private _providerTypes: string[] = [];
    private _providerOptions: Record<string, any> = {};

    constructor(
        private readonly rcloneApiService: RCloneApiService,
        private readonly rcloneFormService: RCloneFormService
    ) {}

    /**
     * Get provider types
     */
    get providerTypes(): string[] {
        return this._providerTypes;
    }

    /**
     * Get provider options
     */
    get providerOptions(): Record<string, any> {
        return this._providerOptions;
    }

    /**
     * Initializes the service by loading provider information
     */
    async onModuleInit(): Promise<void> {
        try {
            await this.loadProviderInfo();
        } catch (error) {
            this.logger.error(`Failed to initialize RcloneBackupSettingsService: ${error}`);
        }
    }

    /**
     * Loads RClone provider types and options
     */
    private async loadProviderInfo(): Promise<void> {
        try {
            const providersResponse = await this.rcloneApiService.getProviders();
            if (providersResponse) {
                // Extract provider types
                this._providerTypes = providersResponse.map((provider) => provider.Name);
                this._providerOptions = providersResponse;
                this.logger.debug(`Loaded ${this._providerTypes.length} provider types`);
            }
        } catch (error) {
            this.logger.error(`Error loading provider information: ${error}`);
            throw error;
        }
    }

    /**
     * Gets current configuration values
     */
    async getCurrentSettings(): Promise<RcloneBackupConfigValues> {
        return {
            configStep: 0,
            showAdvanced: false,
        };
    }

    /**
     * Gets a list of configured remotes
     */
    async getConfiguredRemotes(): Promise<string[]> {
        return this.rcloneApiService.listRemotes();
    }
}
