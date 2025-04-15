import { RuleEffect, type SchemaBasedCondition, type JsonSchema, JsonSchema7 } from '@jsonforms/core';
import type { DataSlice, SettingSlice, UIElement } from '@app/unraid-api/types/json-forms.js';
import { mergeSettingSlices } from '@app/unraid-api/types/json-forms.js';
import { config as rcloneConfig } from './config.js';

/**
 * Type definitions for RClone config options
 */
export interface RCloneOptionDef {
    Name: string;
    Help: string;
    Provider: string;
    Default: any;
    Value: any | null;
    ShortOpt: string;
    Hide: number;
    Required: boolean;
    IsPassword: boolean;
    NoPrefix: boolean;
    Advanced: boolean;
    Type?: string;
    Options?: string[];
}

export interface RCloneProviderDef {
    Name: string;
    Description: string;
    Prefix: string;
    Options: RCloneOptionDef[];
}

/**
 * Translates RClone config option to JsonSchema properties
 */
function translateRCloneOptionToJsonSchema(option: RCloneOptionDef): JsonSchema7 {
    const schema: JsonSchema7 = {
        type: getJsonSchemaType(option.Type || 'string'),
        title: option.Name,
        description: option.Help || '',
    };

    // Add default value if available
    if (option.Default !== undefined && option.Default !== '') {
        schema.default = option.Default;
    }

    // Add enum values if available
    if (option.Options && option.Options.length > 0) {
        schema.enum = option.Options;
    }

    // Add validation constraints
    if (option.Required) {
        if (schema.type === 'string') {
            schema.minLength = 1;
        } else if (schema.type === 'number') {
            schema.minimum = 0;
        }
    }

    return schema;
}

/**
 * Get available provider types from RClone config
 */
export function getAvailableProviderTypes(): string[] {
    return rcloneConfig.map(provider => provider.Name);
}

/**
 * Get provider options for a specific provider
 */
export function getProviderOptions(providerName: string): Record<string, RCloneOptionDef> {
    const provider = rcloneConfig.find(p => p.Name === providerName);
    if (!provider) return {};

    return provider.Options.reduce((acc, option) => {
        acc[option.Name] = option;
        return acc;
    }, {} as Record<string, RCloneOptionDef>);
}

/**
 * Generates the UI schema for RClone remote configuration
 */
export function getRcloneConfigFormSchema(
    providerTypes: string[] = [],
    selectedProvider: string = '',
    providerOptions: Record<string, RCloneOptionDef> = {}
): SettingSlice {
    // If provider types not provided, get from config
    if (providerTypes.length === 0) {
        providerTypes = getAvailableProviderTypes();
    }

    // Combine all form slices for the complete schema
    const slices = [
        getBasicConfigSlice(providerTypes),
        getProviderConfigSlice(selectedProvider, providerOptions),
        getAdvancedConfigSlice(selectedProvider, providerOptions),
    ];

    return mergeSettingSlices(slices);
}

/**
 * Step 1: Basic configuration - name and type selection
 */
function getBasicConfigSlice(providerTypes: string[]): SettingSlice {
    // Create UI elements for basic configuration (Step 1)
    const basicConfigElements: UIElement[] = [
        {
            type: 'Control',
            scope: '#/properties/name',
            label: 'Name of this remote (For your reference)',
            options: {
                placeholder: 'Enter a name',
            },
        },
        {
            type: 'Control',
            scope: '#/properties/type',
            label: 'Storage Provider Type',
            options: {
                format: 'dropdown',
                description: 'Select the cloud storage provider to use for this remote.',
            },
        },
        {
            type: 'Label',
            text: 'Documentation',
            options: {
                format: 'documentation',
                description: 'For more information, refer to the <a href="https://rclone.org/commands/rclone_config/" target="_blank">RClone Config Documentation</a>.',
            },
        },
    ];

    // Define the data schema for basic configuration
    const basicConfigProperties: Record<string, JsonSchema7> = {
        name: {
            type: 'string',
            title: 'Remote Name',
            description: 'Name to identify this remote configuration',
            pattern: '^[a-zA-Z0-9_-]+$',
            minLength: 1,
            maxLength: 50,
        },
        type: {
            type: 'string',
            title: 'Provider Type',
            default: providerTypes.length > 0 ? providerTypes[0] : '',
            oneOf: providerTypes.map(type => ({ const: type, title: type }))
        },
    };

    return {
        properties: basicConfigProperties as unknown as DataSlice,
        elements: basicConfigElements,
    };
}

/**
 * Step 2: Provider-specific configuration based on the selected provider
 */
function getProviderConfigSlice(
    selectedProvider: string,
    providerOptions: Record<string, RCloneOptionDef>
): SettingSlice {
    // Default elements for when a provider isn't selected or options aren't loaded
    let providerConfigElements: UIElement[] = [
        {
            type: 'Label',
            text: 'Provider Configuration',
            options: {
                format: 'loading',
                description: 'Select a provider type first to see provider-specific options.',
            },
        },
    ];

    // Default properties when no provider is selected
    let providerConfigProperties: Record<string, JsonSchema7> = {};

    // If we have a selected provider and options for it
    if (selectedProvider && Object.keys(providerOptions).length > 0) {
        // Create dynamic UI elements based on provider options
        providerConfigElements = Object.entries(providerOptions).map(([key, option]) => {
            if (option.Advanced === true) {
                return null; // Skip advanced options for this step
            }

            return {
                type: 'Control',
                scope: `#/properties/parameters/properties/${key}`,
                label: option.Help || key,
                options: {
                    placeholder: option.Default?.toString() || '',
                    description: option.Help || '',
                    required: option.Required || false,
                    format: getFormatForType(option.Type, option.Options),
                    hide: option.Hide === 1,
                },
            };
        }).filter(Boolean) as UIElement[];

        // No options available case
        if (providerConfigElements.length === 0) {
            providerConfigElements = [
                {
                    type: 'Label',
                    text: 'No Configuration Required',
                    options: {
                        description: 'This provider does not require additional configuration, or all options are advanced.',
                    },
                },
            ];
        }

        // Create dynamic properties schema based on provider options
        const paramProperties: Record<string, JsonSchema7> = {};
        
        Object.entries(providerOptions).forEach(([key, option]) => {
            if (option.Advanced === true) {
                return; // Skip advanced options for this step
            }

            paramProperties[key] = translateRCloneOptionToJsonSchema(option);
        });

        providerConfigProperties = {
            parameters: {
                type: 'object',
                properties: paramProperties,
            },
        };
    }

    return {
        properties: providerConfigProperties as unknown as DataSlice,
        elements: providerConfigElements,
    };
}

/**
 * Step 3: Advanced configuration options for the selected provider
 */
function getAdvancedConfigSlice(
    selectedProvider: string,
    providerOptions: Record<string, RCloneOptionDef>
): SettingSlice {
    // Default elements when no advanced options are available
    let advancedConfigElements: UIElement[] = [
        {
            type: 'Label',
            text: 'Advanced Configuration',
            options: {
                format: 'note',
                description: 'No advanced options available for this provider.',
            },
        },
    ];

    // Default properties
    let advancedConfigProperties: Record<string, JsonSchema7> = {};

    // If we have a selected provider and options
    if (selectedProvider && Object.keys(providerOptions).length > 0) {
        // Create dynamic UI elements for advanced options
        const advancedElements = Object.entries(providerOptions).map(([key, option]) => {
            if (!option.Advanced) {
                return null; // Skip non-advanced options
            }

            return {
                type: 'Control',
                scope: `#/properties/parameters/properties/${key}`,
                label: option.Help || key,
                options: {
                    placeholder: option.Default?.toString() || '',
                    description: option.Help || '',
                    required: option.Required || false,
                    format: getFormatForType(option.Type, option.Options),
                    hide: option.Hide === 1,
                },
            };
        }).filter(Boolean) as UIElement[];

        // Use default message if no advanced options
        if (advancedElements.length > 0) {
            advancedConfigElements = advancedElements;
        }

        // Create dynamic properties schema for advanced options
        const advancedProperties: Record<string, JsonSchema7> = {};
        
        Object.entries(providerOptions).forEach(([key, option]) => {
            if (!option.Advanced) {
                return; // Skip non-advanced options
            }

            advancedProperties[key] = translateRCloneOptionToJsonSchema(option);
        });

        // Only add if we have advanced options
        if (Object.keys(advancedProperties).length > 0) {
            advancedConfigProperties = {
                parameters: {
                    type: 'object',
                    properties: advancedProperties,
                },
            };
        }
    }

    return {
        properties: advancedConfigProperties as unknown as DataSlice,
        elements: advancedConfigElements,
    };
}

/**
 * Helper function to convert RClone option types to JSON Schema types
 */
function getJsonSchemaType(rcloneType: string): string {
    switch (rcloneType?.toLowerCase()) {
        case 'int':
        case 'size':
        case 'duration':
            return 'number';
        case 'bool':
            return 'boolean';
        case 'string':
        case 'text':
        default:
            return 'string';
    }
}

/**
 * Helper function to get the appropriate UI format based on RClone option type
 */
function getFormatForType(rcloneType: string = '', options: string[] | null = null): string {
    if (options && options.length > 0) {
        return 'dropdown';
    }

    switch (rcloneType?.toLowerCase()) {
        case 'int':
        case 'size':
            return 'number';
        case 'duration':
            return 'duration';
        case 'bool':
            return 'checkbox';
        case 'password':
            return 'password';
        case 'text':
            return 'textarea';
        default:
            return 'text';
    }
}

/**
 * Returns a combined form schema for the rclone backup configuration UI
 */
export function getRcloneConfigSlice(): SettingSlice {
    const elements: UIElement[] = [
        {
            type: 'Label',
            text: 'Configure RClone Backup',
            options: {
                format: 'title',
                description: 'This 3-step process will guide you through setting up your RClone backup configuration.',
            },
        },
        {
            type: 'Control',
            scope: '#/properties/configStep',
            label: 'Configuration Step',
            options: {
                format: 'stepper',
                steps: [
                    { label: 'Set up Remote Config', description: 'Name and provider selection' },
                    { label: 'Set up Drive', description: 'Provider-specific configuration' },
                    { label: 'Advanced Config', description: 'Optional advanced settings' },
                ],
            },
        },
        {
            type: 'Control',
            scope: '#/properties/showAdvanced',
            label: 'Edit Advanced Options',
            options: {
                format: 'checkbox',
            },
            rule: {
                effect: RuleEffect.SHOW,
                condition: {
                    scope: '#/properties/configStep',
                    schema: { enum: [1] } // Only show on step 2
                } as SchemaBasedCondition,
            },
        },
    ];

    // Basic properties for the rclone backup configuration
    const properties: Record<string, JsonSchema7> = {
        configStep: {
            type: 'number',
            minimum: 0,
            maximum: 2,
            default: 0,
        },
        showAdvanced: {
            type: 'boolean',
            default: false,
        },
    };

    return {
        properties: properties as unknown as DataSlice,
        elements,
    };
}
