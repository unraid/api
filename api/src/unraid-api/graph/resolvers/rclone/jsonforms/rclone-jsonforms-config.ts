import type { SchemaBasedCondition } from '@jsonforms/core';
import { JsonSchema7, RuleEffect } from '@jsonforms/core';

import type { DataSlice, SettingSlice, UIElement } from '@app/unraid-api/types/json-forms.js';
import { RCloneProviderOptionResponse } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { mergeSettingSlices } from '@app/unraid-api/types/json-forms.js';

/**
 * Translates RClone config option to JsonSchema properties
 */
function translateRCloneOptionToJsonSchema(option: RCloneProviderOptionResponse): JsonSchema7 {
    const schema: JsonSchema7 = {
        type: getJsonSchemaType(option.Type || 'string'),
        title: option.Name,
        description: option.Help || '',
    };

    // Add default value if available
    if (option.Default !== undefined && option.Default !== '') {
        // RClone uses 'off' for SizeSuffix/Duration defaults sometimes
        if ((option.Type === 'SizeSuffix' || option.Type === 'Duration') && option.Default === 'off') {
            schema.default = 'off';
        } else if (schema.type === 'number' && typeof option.Default === 'number') {
            schema.default = option.Default;
        } else if (schema.type === 'integer' && Number.isInteger(option.Default)) {
            schema.default = option.Default;
        } else if (schema.type === 'boolean' && typeof option.Default === 'boolean') {
            schema.default = option.Default;
        } else if (schema.type === 'string') {
            // Ensure default is a string if the type is string
            schema.default = String(option.Default);
        }
        // If type doesn't match, we might skip the default or log a warning
    }

    // Add enum values if available (used for dropdowns)
    if (option.Examples && option.Examples.length > 0) {
        schema.enum = option.Examples.map((example) => example.Value);
    }

    // Add format hints
    const format = getJsonFormElementForType(
        option.Type,
        option.Examples?.map((example) => example.Value),
        option.IsPassword
    );
    if (format && format !== schema.type) {
        // Don't add format if it's just the type (e.g., 'number')
        schema.format = format;
    }

    // Add validation constraints and patterns
    if (option.Required) {
        // Make '0' valid for required number/integer fields unless explicitly disallowed
        if (schema.type === 'string') {
            schema.minLength = 1;
        }
        // Note: 'required' is usually handled at the object level in JSON Schema,
        // but minLength/minimum provide basic non-empty checks.
    }

    // Specific type-based validation
    switch (option.Type?.toLowerCase()) {
        case 'int':
            // Handled by type: 'integer' in getJsonSchemaType
            break;
        case 'sizesuffix':
            // Pattern allows 'off' or digits followed by optional size units (K, M, G, T, P) and optional iB/B
            // Allows multiple concatenated values like 1G100M
            schema.pattern = '^(off|(\\d+([KMGTPE]i?B?)?)+)$';
            schema.errorMessage = 'Invalid size format. Examples: "10G", "100M", "1.5GiB", "off".';
            break;
        case 'duration':
            // Pattern allows 'off' or digits (with optional decimal) followed by time units (ns, us, ms, s, m, h)
            // Allows multiple concatenated values like 1h15m
            schema.pattern = '^(off|(\\d+(\\.\\d+)?(ns|us|\\u00b5s|ms|s|m|h))+)$'; // \u00b5s is µs
            schema.errorMessage =
                'Invalid duration format. Examples: "10s", "1.5m", "100ms", "1h15m", "off".';
            break;
    }

    return schema;
}

/**
 * Generates the UI schema for RClone remote configuration
 */
export function getRcloneConfigFormSchema(
    providerTypes: string[] = [],
    selectedProvider: string = '',
    providerOptions: Record<string, RCloneProviderOptionResponse[]> = {}
): SettingSlice {
    // Combine all form slices for the complete schema
    const options = providerOptions[selectedProvider];
    const slices = [
        getBasicConfigSlice(providerTypes),
        getProviderConfigSlice(selectedProvider, options, false), // Standard options
        getProviderConfigSlice(selectedProvider, options, true), // Advanced options
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
                format: 'string',
            },
        },
        {
            type: 'Control',
            scope: '#/properties/type',
            label: 'Storage Provider Type',
            options: {
                description: 'Select the cloud storage provider to use for this remote.',
            },
        },
        {
            type: 'Label',
            text: 'Documentation',
            options: {
                format: 'documentation',
                description:
                    'For more information, refer to the <a href="https://rclone.org/commands/rclone_config/" target="_blank">RClone Config Documentation</a>.',
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
            enum: providerTypes,
        },
    };

    return {
        properties: basicConfigProperties as unknown as DataSlice,
        elements: basicConfigElements,
    };
}

/**
 * Step 2/3: Provider-specific configuration based on the selected provider and whether to show advanced options
 *
 * @param selectedProvider - The selected provider type
 * @param providerOptions - The provider options for the selected provider
 */
function getProviderConfigSlice(
    selectedProvider: string,
    providerOptions: RCloneProviderOptionResponse[],
    showAdvancedOptions: boolean = false
): SettingSlice {
    // Default elements for when a provider isn't selected or options aren't loaded
    let configElements: UIElement[] = [
        {
            type: 'Label',
            text: `${showAdvancedOptions ? 'Advanced' : 'Provider'} Configuration`,
            options: {
                format: 'loading', // Or 'note' if preferred
                description: `Select a provider type first to see ${showAdvancedOptions ? 'advanced' : 'standard'} options.`,
            },
        },
    ];

    // Default properties when no provider is selected
    let configProperties: Record<string, JsonSchema7> = {};

    if (!selectedProvider || providerOptions.length === 0) {
        return {
            properties: configProperties as unknown as DataSlice,
            elements: [],
        };
    }

    // Filter options based on the showAdvancedOptions flag
    const filteredOptions = providerOptions.filter((option) => {
        if (showAdvancedOptions && option.Advanced === true) {
            return true;
        } else if (!showAdvancedOptions && option.Advanced !== true) {
            return true;
        }
        return false;
    });

    // Create dynamic UI elements based on filtered provider options
    const elements = filteredOptions.map<UIElement>((option) => {
        return {
            type: 'Control',
            scope: `#/properties/parameters/properties/${option.Name}`,
            label: option.Help || option.Name, // Use Help as primary label if available
            options: {
                placeholder: option.Default?.toString() || '',
                description: option.Help || '', // Redundant? Keep for potential differences
                required: option.Required || false,
                format: getJsonFormElementForType(
                    option.Type,
                    option.Examples?.map((example) => example.Value),
                    option.IsPassword
                ),
                hide: option.Hide === 1,
            },
        };
    });

    // Create dynamic properties schema based on filtered provider options
    const paramProperties: Record<string, JsonSchema7> = {};
    filteredOptions.forEach((option) => {
        if (option) {
            // Ensure option exists before translating
            paramProperties[option.Name] = translateRCloneOptionToJsonSchema(option);
        }
    });

    console.log('paramProperties', paramProperties);

    // Only add parameters object if there are properties
    if (Object.keys(paramProperties).length > 0) {
        configProperties = {
            parameters: {
                type: 'object',
                properties: paramProperties,
            },
        };
    }

    return {
        properties: configProperties,
        elements,
    };
}

/**
 * Helper function to convert RClone option types to JSON Schema types
 */
function getJsonSchemaType(rcloneType: string): string {
    switch (rcloneType?.toLowerCase()) {
        case 'int':
            return 'integer'; // Use 'integer' for whole numbers
        case 'size': // Assuming 'size' might imply large numbers, but 'number' is safer if decimals possible
        case 'number': // If rclone explicitly uses 'number'
            return 'number';
        case 'sizesuffix':
        case 'duration':
            // Represent these as strings, validation handled by pattern/format
            return 'string';
        case 'bool':
            return 'boolean';
        case 'string':
        case 'text': // Treat 'text' (multi-line) as 'string' in schema type
        case 'password': // Passwords are strings
        default:
            // Default to string if type is unknown or not provided
            return 'string';
    }
}

/**
 * Helper function to get the appropriate UI format based on RClone option type
 */
function getJsonFormElementForType(
    rcloneType: string = '',
    options: string[] | null = null,
    isPassword: boolean = false
): string | undefined {
    if (isPassword) {
        return 'password';
    }
    if (options && options.length > 0) {
        return 'dropdown'; // Use enum for dropdowns
    }

    switch (rcloneType?.toLowerCase()) {
        case 'int':
            return 'number'; // Use NumberField
        case 'size':
            return 'number'; // Use NumberField
        case 'sizesuffix':
            return undefined; // Use default InputField (via isStringControl)
        case 'duration':
            return undefined; // Use default InputField (via isStringControl)
        case 'bool':
            return 'checkbox'; // Matches Switch.vue if toggle=true, else default bool render
        case 'text':
            // Consider 'textarea' format later if needed
            return undefined; // Use default InputField (via isStringControl)
        case 'password':
            return 'password'; // Explicit format for password managers etc.
        case 'string':
        default:
            return undefined; // Use default InputField (via isStringControl)
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
                description:
                    'This 3-step process will guide you through setting up your RClone backup configuration.',
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
                    schema: { enum: [1] }, // Only show on step 2
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
