import type { Layout, SchemaBasedCondition } from '@jsonforms/core';
import { JsonSchema7, RuleEffect } from '@jsonforms/core';
import { filter } from 'rxjs';

import type { DataSlice, SettingSlice, UIElement } from '@app/unraid-api/types/json-forms.js';
import { RCloneProviderOptionResponse } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { mergeSettingSlices } from '@app/unraid-api/types/json-forms.js';

/**
 * Translates RClone config option to JsonSchema properties
 */
function translateRCloneOptionToJsonSchema({
    option,
}: {
    option: RCloneProviderOptionResponse;
}): JsonSchema7 {
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
    }

    // Add format hints
    const format = getJsonFormElementForType({
        rcloneType: option.Type,
        examples: option.Examples?.map((example) => example.Value),
        isPassword: option.IsPassword,
    });
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
            schema.pattern = '^(off|(\d+([KMGTPE]i?B?)?)+)$';
            schema.errorMessage = 'Invalid size format. Examples: "10G", "100M", "1.5GiB", "off".';
            break;
        case 'duration':
            // Pattern allows 'off' or digits (with optional decimal) followed by time units (ns, us, ms, s, m, h)
            // Allows multiple concatenated values like 1h15m
            schema.pattern = '^(off|(\d+(\.\d+)?(ns|us|\u00b5s|ms|s|m|h))+)$'; // µs is µs
            schema.errorMessage =
                'Invalid duration format. Examples: "10s", "1.5m", "100ms", "1h15m", "off".';
            break;
    }

    return schema;
}

/**
 * Step 1: Basic configuration - name and type selection
 * Returns a SettingSlice containing properties and a VerticalLayout UI element with options.step = 0.
 */
function getBasicConfigSlice({ providerTypes }: { providerTypes: string[] }): SettingSlice {
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
            text: 'Documentation Link',
            options: {
                description: 'For more information, refer to the [RClone Config Documentation](https://rclone.org/commands/rclone_config/).',
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

    // Wrap the basic elements in a VerticalLayout marked for step 0
    const verticalLayoutElement: UIElement = {
        type: 'VerticalLayout',
        elements: basicConfigElements,
        options: { step: 0 }, // Assign to step 0
    };

    return {
        properties: basicConfigProperties as unknown as DataSlice,
        elements: [verticalLayoutElement], // Return the VerticalLayout as the single element
    };
}

/**
 * Step 2/3: Provider-specific configuration based on the selected provider and type (standard/advanced).
 * Returns a SettingSlice containing properties and a VerticalLayout UI element with options.step = stepIndex.
 */
export function getProviderConfigSlice({
    selectedProvider,
    providerOptions,
    type = 'standard',
    stepIndex, // Added stepIndex parameter
}: {
    selectedProvider: string;
    providerOptions: RCloneProviderOptionResponse[];
    type?: 'standard' | 'advanced';
    stepIndex: number; // Required step index for the rule
}): SettingSlice {
    // Default properties when no provider is selected
    let configProperties: DataSlice = {};

    if (!selectedProvider || !providerOptions || providerOptions.length === 0) {
        return {
            properties: configProperties,
            elements: [], // Return empty elements if no provider or options
        };
    }

    // Filter options based on the type (standard/advanced)
    const filteredOptions = providerOptions.filter((option) => {
        if (type === 'advanced' && option.Advanced === true) {
            return true;
        } else if (type === 'standard' && option.Advanced !== true) {
            return true;
        }
        return false;
    });

    // Ensure uniqueness based on Name *within this slice* to prevent overwrites
    const uniqueOptionsByName = filteredOptions.reduce((acc, current) => {
        if (!acc.find((item) => item.Name === current.Name)) {
            acc.push(current);
        } else {
            console.warn(`Duplicate RClone option name skipped in ${type} slice: ${current.Name}`);
        }
        return acc;
    }, [] as RCloneProviderOptionResponse[]);

    // If no options match the filter, return empty
    if (uniqueOptionsByName.length === 0) {
        return {
            properties: configProperties,
            elements: [],
        };
    }

    // Create dynamic UI control elements based on unique provider options
    const controlElements = uniqueOptionsByName.map<UIElement>((option) => {
        const format = getJsonFormElementForType({
            rcloneType: option.Type,
            examples: option.Examples?.map((example) => example.Value),
            isPassword: option.IsPassword,
        });

        const controlOptions: Record<string, any> = {
            placeholder: option.Default?.toString() || '',
            help: option.Help || '',
            required: option.Required || false,
            format,
            hide: option.Hide === 1,
        };

        // Use examples for placeholder if available
        if (option.Examples && option.Examples.length > 0) {
            const exampleValues = option.Examples.map((example) => example.Value).join(', ');
            controlOptions.placeholder = `e.g., ${exampleValues}`;
        }

        // Only add toggle option for boolean fields without examples
        if (format === 'checkbox' && (!option.Examples || option.Examples.length === 0)) {
            controlOptions.toggle = true;
        }

        // Add examples as suggestions for combobox
        if (format === 'combobox' && option.Examples && option.Examples.length > 0) {
            controlOptions.suggestions = option.Examples.map((example) => ({
                value: example.Value,
                label: example.Value, // Set label to just the value
                tooltip: example.Help || '', // Add tooltip with help text
            }));
        }

        // --- Start: Add dynamic visibility rule based on Provider --- //
        let providerRule: { effect: RuleEffect; condition: SchemaBasedCondition } | undefined =
            undefined;
        const providerFilter = option.Provider?.trim();

        if (providerFilter) {
            const isNegated = providerFilter.startsWith('!');
            const providers = (isNegated ? providerFilter.substring(1) : providerFilter)
                .split(',')
                .map((p) => p.trim())
                .filter((p) => p);

            if (providers.length > 0) {
                const conditionSchema = isNegated
                    ? { not: { enum: providers } } // Show if type is NOT in the list
                    : { enum: providers }; // Show if type IS in the list

                providerRule = {
                    effect: RuleEffect.SHOW,
                    condition: {
                        scope: '#/properties/type',
                        schema: conditionSchema,
                    } as SchemaBasedCondition,
                };
            }
        }
        // --- End: Add dynamic visibility rule based on Provider --- //

        const uiElement: UIElement = {
            type: 'Control',
            scope: `#/properties/parameters/properties/${option.Name}`,
            label: option.Help || option.Name,
            options: controlOptions,
            // Add the provider-specific rule if it was generated
            ...(providerRule && { rule: providerRule }),
        };
        return uiElement;
    });

    // Create dynamic properties schema based on unique provider options
    const paramProperties: Record<string, JsonSchema7> = {};
    uniqueOptionsByName.forEach((option) => {
        if (option) {
            paramProperties[option.Name] = translateRCloneOptionToJsonSchema({ option });
            console.log('paramProperties', option.Name, paramProperties[option.Name]);
        }
    });

    // Only add parameters object if there are properties
    if (Object.keys(paramProperties).length > 0) {
        // Ensure parameters object exists and has a properties key
        if (!configProperties.parameters) {
            configProperties.parameters = { type: 'object', properties: {} } as any;
        } else if (!(configProperties.parameters as any).properties) {
            (configProperties.parameters as any).properties = {};
        }
        // Merge the new paramProperties into the existing parameters.properties
        (configProperties.parameters as any).properties = {
            ...(configProperties.parameters as any).properties,
            ...paramProperties,
        };
    }

    // Wrap the control elements in a VerticalLayout marked for the specified stepIndex
    const verticalLayoutElement: UIElement = {
        type: 'VerticalLayout',
        elements: controlElements,
        options: { step: stepIndex }, // Assign to the specified stepIndex
    };

    return {
        properties: configProperties,
        elements: [verticalLayoutElement], // Return the VerticalLayout as the single element
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
function getJsonFormElementForType({
    rcloneType = '',
    examples = null,
    isPassword = false,
}: {
    rcloneType?: string;
    examples?: string[] | null;
    isPassword?: boolean;
}): string | undefined {
    if (isPassword) {
        return 'password';
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
            // Only use checkbox/toggle for boolean fields without examples
            if (!examples || examples.length === 0) {
                return 'checkbox';
            }
            return 'combobox'; // Use combobox for boolean fields with examples
        case 'text':
            // Consider 'textarea' format later if needed
            return undefined; // Use default InputField (via isStringControl)
        case 'password':
            return 'password'; // Explicit format for password managers etc.
        case 'string':
        default:
            // Use combobox for string fields with examples
            if (examples && examples.length > 0) {
                return 'combobox';
            }
            return undefined; // Use default InputField (via isStringControl)
    }
}

/**
 * Builds the complete settings schema for the RClone config UI, returning the final dataSchema and uiSchema.
 * Integrates step-specific elements directly into the SteppedLayout's elements array.
 */
export function buildRcloneConfigSchema({
    providerTypes = [],
    selectedProvider = '',
    providerOptions = {},
}: {
    providerTypes?: string[];
    selectedProvider?: string;
    providerOptions?: Record<string, RCloneProviderOptionResponse[]>;
}): {
    dataSchema: Record<string, any>;
    uiSchema: Layout;
} {
    // --- Schema Definition ---

    // Define the step control property - REMOVED as SteppedLayout uses local state
    // const stepControlProperty: Record<string, JsonSchema7> = {
    //     configStep: {
    //         type: 'number',
    //         minimum: 0,
    //         maximum: 2, // 3 steps: 0, 1, 2
    //         default: 0,
    //     },
    // };

    // --- Step Content Generation ---

    const optionsForProvider = providerOptions[selectedProvider] || [];

    // Step 0: Basic Config
    const basicSlice = getBasicConfigSlice({ providerTypes });

    // Step 1: Standard Provider Config
    const standardConfigSlice = getProviderConfigSlice({
        selectedProvider,
        providerOptions: optionsForProvider,
        type: 'standard',
        stepIndex: 1, // Assign to step 1
    });

    // Step 2: Advanced Provider Config
    const advancedConfigSlice = getProviderConfigSlice({
        selectedProvider,
        providerOptions: optionsForProvider,
        type: 'advanced',
        stepIndex: 2, // Assign to step 2
    });

    // Merge all properties: basic + standard + advanced
    const mergedProperties = mergeSettingSlices([basicSlice, standardConfigSlice, advancedConfigSlice]);

    // Construct the final dataSchema
    const dataSchema = {
        type: 'object',
        properties: mergedProperties.properties,
        // Add required fields if necessary, e.g., ['name', 'type']
        // required: ['name', 'type'], // Example: Make name and type required globally
    };

    // --- UI Schema Definition ---

    // Define the SteppedLayout UI element, now containing step content elements
    const steppedLayoutElement: UIElement = {
        type: 'SteppedLayout',
        options: {
            steps: [
                { label: 'Set up Remote Config', description: 'Name and provider selection' },
                { label: 'Set up Drive', description: 'Provider-specific configuration' },
                { label: 'Advanced Config', description: 'Optional advanced settings' },
            ],
        },
        // Nest the step content elements directly inside the SteppedLayout
        elements: mergedProperties.elements,
    };

    // Define the overall title label
    const titleLabel: UIElement = {
        type: 'Label',
        text: 'Configure RClone Remote',
        options: {
            format: 'title',
            description: 'This 3-step process will guide you through setting up your RClone remote configuration.',
        },
    };

    // --- Merging and Final Output ---

    // Construct the final uiSchema with Title + SteppedLayout (containing steps)
    const uiSchema: Layout = {
        type: 'VerticalLayout',
        elements: [
            titleLabel,
            steppedLayoutElement, // The Stepper control, now containing its step elements
            // Step content elements are now *inside* steppedLayoutElement.elements
        ],
    };

    return { dataSchema, uiSchema };
}
