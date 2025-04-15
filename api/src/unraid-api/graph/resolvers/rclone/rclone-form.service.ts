import { Injectable, Logger } from '@nestjs/common';
import { type Layout } from '@jsonforms/core';

import type { SettingSlice } from '@app/unraid-api/types/json-forms.js';
import { mergeSettingSlices } from '@app/unraid-api/types/json-forms.js';

import { 
    getRcloneConfigFormSchema, 
    getRcloneConfigSlice,
    getAvailableProviderTypes,
} from './jsonforms/rclone-jsonforms-config.js';
import { RCloneApiService } from './rclone-api.service.js';

/**
 * Service responsible for generating form UI schemas and form logic
 */
@Injectable()
export class RCloneFormService {
    private readonly logger = new Logger(RCloneFormService.name);
    private _providerTypes: string[] = [];
    private _providerOptions: Record<string, any> = {};

    constructor(
        private readonly rcloneApiService: RCloneApiService
    ) {}

    /**
     * Loads RClone provider types and options
     */
    private async loadProviderInfo(): Promise<void> {
        try {
            const providersResponse = await this.rcloneApiService.getProviders();
            if (providersResponse) {
                // Extract provider types
                this._providerTypes = providersResponse.map(provider => provider.name);
                this._providerOptions = providersResponse.reduce((acc, provider) => {
                    acc[provider.name] = provider.options;
                    return acc;
                }, {});
                this.logger.debug(`Loaded ${this._providerTypes.length} provider types`);
            }
        } catch (error) {
            this.logger.error(`Error loading provider information: ${error}`);
            throw error;
        }
    }

    /**
     * Builds the complete settings schema
     */
    async buildSettingsSchema(
        providerTypes: string[] = [],
        selectedProvider: string = '',
        providerOptions: Record<string, any> = {}
    ): Promise<SettingSlice> {
        // Get the stepper UI and the form based on the selected provider
        const baseSlice = getRcloneConfigSlice();
        const formSlice = getRcloneConfigFormSchema(
            providerTypes,
            selectedProvider,
            providerOptions
        );

        return mergeSettingSlices([baseSlice, formSlice]);
    }

    /**
     * Returns the data schema for the form
     */
    async dataSchema(
        providerTypes: string[] = [],
        selectedProvider: string = '',
        providerOptions: Record<string, any> = {}
    ): Promise<Record<string, any>> {
        // If provider types weren't provided and we haven't loaded them yet, try to load them
        if (providerTypes.length === 0 && this._providerTypes.length === 0) {
            await this.loadProviderInfo();
            providerTypes = this._providerTypes;
            providerOptions = this._providerOptions;
        }
        
        const { properties } = await this.buildSettingsSchema(
            providerTypes,
            selectedProvider,
            providerOptions
        );
        return {
            type: 'object',
            properties,
        };
    }

    /**
     * Returns the UI schema for the form
     */
    async uiSchema(
        providerTypes: string[] = [],
        selectedProvider: string = '',
        providerOptions: Record<string, any> = {}
    ): Promise<Layout> {
        // If provider types weren't provided and we haven't loaded them yet, try to load them
        if (providerTypes.length === 0 && this._providerTypes.length === 0) {
            await this.loadProviderInfo();
            providerTypes = this._providerTypes;
            providerOptions = this._providerOptions;
        }
        
        const { elements } = await this.buildSettingsSchema(
            providerTypes,
            selectedProvider,
            providerOptions
        );
        return {
            type: 'VerticalLayout',
            elements,
        };
    }
} 