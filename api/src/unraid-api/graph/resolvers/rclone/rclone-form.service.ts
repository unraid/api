import { Injectable, Logger } from '@nestjs/common';



import { type Layout } from '@jsonforms/core';



import type { SettingSlice } from '@app/unraid-api/types/json-forms.js';
import { RCloneProviderOptionResponse, RCloneProviderResponse } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { mergeSettingSlices } from '@app/unraid-api/types/json-forms.js';



import { getRcloneConfigFormSchema, getRcloneConfigSlice } from './jsonforms/rclone-jsonforms-config.js';
import { RCloneApiService } from './rclone-api.service.js';


/**
 * Field metadata interface for form generation
 */
interface FieldMetadata {
    name: string;
    label: string;
    type: string;
    required: boolean;
    default: any;
    examples: any[];
    options: string[];
    validationType: string;
}

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
     * Determines the appropriate input type for a parameter based on its configuration
     * Following the logic from rclone-webui-react
     */
    private getInputType(attr: any): string {
        if (attr.IsPassword) {
            return 'password';
        } else if (!this.isEmpty(attr.Examples)) {
            return 'string';
        } else if (attr.Type === 'bool') {
            return 'select';
        } else if (attr.Type === 'int') {
            return 'number';
        } else if (attr.Type === 'string') {
            return 'text';
        } else if (attr.Type === 'SizeSuffix') {
            return 'string'; // Special validation will be applied
        } else if (attr.Type === 'Duration') {
            return 'string'; // Special validation will be applied
        } else {
            return 'text';
        }
    }

    /**
     * Helper method to check if a value is empty (null, undefined, or empty array/object)
     * Following the logic from rclone-webui-react
     */
    private isEmpty(value: any): boolean {
        if (value === null || value === undefined) {
            return true;
        }
        if (Array.isArray(value) && value.length === 0) {
            return true;
        }
        if (typeof value === 'object' && Object.keys(value).length === 0) {
            return true;
        }
        return false;
    }

    /**
     * Validates size suffix format (e.g., "10G", "100M")
     * Following the logic from rclone-webui-react
     */
    private validateSizeSuffix(value: string): boolean {
        if (value === 'off' || value === '') return true;
        const regex = /^(\d+)([KMGT])?$/i;
        return regex.test(value);
    }

    /**
     * Validates duration format (e.g., "10ms", "1h30m")
     * Following the logic from rclone-webui-react
     */
    private validateDuration(value: string): boolean {
        if (value === '' || value === 'off') return true;
        const regex = /^((\d+)h)?((\d+)m)?((\d+)s)?((\d+)ms)?$/i;
        return regex.test(value);
    }

    /**
     * Validates integer format
     * Following the logic from rclone-webui-react
     */
    private validateInt(value: string): boolean {
        if (value === '') return true;
        const regex = /^\d+$/;
        return regex.test(value);
    }

    /**
     * Process provider options to create form fields
     * Following the logic from rclone-webui-react
     */
    private processProviderOptions(
        providerOptions: RCloneProviderOptionResponse[],
        loadAdvanced: boolean = false
    ): {
        fields: FieldMetadata[];
        required: Record<string, boolean>;
        optionTypes: Record<string, string>;
    } {
        if (!providerOptions) {
            return { fields: [], required: {}, optionTypes: {} };
        }

        const fields: FieldMetadata[] = [];
        const required: Record<string, boolean> = {};
        const optionTypes: Record<string, string> = {};

        for (const attr of providerOptions) {
            // Skip hidden options and respect advanced flag
            if (
                attr.Hide === 0 &&
                ((loadAdvanced && attr.Advanced) || (!loadAdvanced && !attr.Advanced))
            ) {
                const inputType = this.getInputType(attr);

                // Build field metadata
                const field: FieldMetadata = {
                    name: attr.Name,
                    label: attr.Help || attr.Name,
                    type: inputType,
                    required: attr.Required || false,
                    default: attr.DefaultStr || attr.Default,
                    examples: attr.Examples || [],
                    options: attr.Type === 'bool' ? ['Yes', 'No'] : [],
                    validationType: attr.Type || '',
                };

                fields.push(field);

                // Track required fields
                if (attr.Required) {
                    required[attr.Name] = true;
                }

                // Track option types for validation
                optionTypes[attr.Name] = attr.Type ?? '';
            }
        }

        return { fields, required, optionTypes };
    }

    /**
     * Builds the complete settings schema
     * Modified to support both standard and advanced options
     */
    async buildSettingsSchema(
        selectedProvider: string = '',
        loadAdvanced: boolean = false
    ): Promise<SettingSlice> {
        // Ensure provider info is loaded
        if (Object.keys(this.providerOptions).length === 0) {
            await this.loadProviderInfo();
        }

        // Get the stepper UI and the form based on the selected provider
        const baseSlice = getRcloneConfigSlice();
        this.logger.debug('Getting rclone form schema for provider: ' + selectedProvider);

        // Check if the form schema generator supports the loadAdvanced parameter
        // If not, we'll handle the advanced filtering in our own logic
        const formSlice = getRcloneConfigFormSchema(
            this.providerNames,
            selectedProvider,
            this.providerOptions
        );

        return mergeSettingSlices([baseSlice, formSlice]);
    }

    /**
     * Returns both data schema and UI schema for the form
     * Now supports advanced options toggle
     */
    async getFormSchemas(
        selectedProvider: string = '',
        loadAdvanced: boolean = false
    ): Promise<{
        dataSchema: Record<string, any>;
        uiSchema: Layout;
        validationInfo: {
            required: Record<string, boolean>;
            optionTypes: Record<string, string>;
        };
    }> {
        // Ensure provider info is loaded
        if (Object.keys(this.providerOptions).length === 0) {
            await this.loadProviderInfo();
        }

        const { properties, elements } = await this.buildSettingsSchema(selectedProvider, loadAdvanced);

        // Process provider options to get validation information
        const providerOpts = selectedProvider ? this.providerOptions[selectedProvider] : [];
        const { required, optionTypes } = this.processProviderOptions(providerOpts, loadAdvanced);

        return {
            dataSchema: {
                type: 'object',
                properties,
            },
            uiSchema: {
                type: 'VerticalLayout',
                elements,
            },
            validationInfo: {
                required,
                optionTypes,
            },
        };
    }

    /**
     * Validates form values based on their types
     * Following the logic from rclone-webui-react
     */
    validateFormValues(
        values: Record<string, any>,
        optionTypes: Record<string, string>
    ): Record<string, { valid: boolean; error: string }> {
        const result: Record<string, { valid: boolean; error: string }> = {};

        for (const [key, value] of Object.entries(values)) {
            const inputType = optionTypes[key];
            let isValid = true;
            let error = '';

            // Skip if no value or no type
            if (!value || !inputType) {
                result[key] = { valid: true, error: '' };
                continue;
            }

            // Validate based on type
            if (inputType === 'SizeSuffix') {
                isValid = this.validateSizeSuffix(value as string);
                if (!isValid) {
                    error = 'Valid format: off | {number}{unit} (e.g., 10G, 100M)';
                }
            } else if (inputType === 'Duration') {
                isValid = this.validateDuration(value as string);
                if (!isValid) {
                    error = 'Valid format: {number}{unit} (e.g., 10ms, 1h30m)';
                }
            } else if (inputType === 'int') {
                isValid = this.validateInt(value as string);
                if (!isValid) {
                    error = 'Must be a valid integer';
                }
            }

            result[key] = { valid: isValid, error };
        }

        return result;
    }
}