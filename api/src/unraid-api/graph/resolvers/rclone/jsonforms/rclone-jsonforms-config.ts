import type { LabelElement, Layout, Rule, SchemaBasedCondition } from '@jsonforms/core';
import { JsonSchema7, RuleEffect } from '@jsonforms/core';

import type { DataSlice, SettingSlice, UIElement } from '@app/unraid-api/types/json-forms.js';
import { RCloneProviderOptionResponse } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { createLabeledControl } from '@app/unraid-api/graph/utils/form-utils.js';
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
    if (format && format !== schema.type && format !== 'combobox') {
        // Don't add format if it's just the type (e.g., 'number')
        // Don't add non-standard UI hints like 'combobox' to the schema format
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
            schema.pattern = '^(off|(d+([KMGTPE]i?B?)?)+)$';
            schema.errorMessage = 'Invalid size format. Examples: "10G", "100M", "1.5GiB", "off".';
            break;
        case 'duration':
            // Pattern allows 'off' or digits (with optional decimal) followed by time units (ns, us, ms, s, m, h)
            // Allows multiple concatenated values like 1h15m
            schema.pattern = '^(off|(d+(.d+)?(ns|us|\u00b5s|ms|s|m|h))+)$';
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
        // --- START: Refactored 'name' field using helper ---
        createLabeledControl({
            scope: '#/properties/name',
            label: 'Remote Name',
            description:
                'Name to identify this remote configuration (e.g., my_google_drive). Use only letters, numbers, hyphens, and underscores.',
            controlOptions: {
                placeholder: 'Enter a name',
                format: 'string',
            },
            // Add layoutOptions if needed, e.g., layoutOptions: { style: 'margin-bottom: 1em;' }
        }),
        // --- END: Refactored 'name' field using helper ---

        // --- START: Refactored 'type' field using helper ---
        createLabeledControl({
            scope: '#/properties/type',
            label: 'Storage Provider Type',
            description: 'Select the cloud storage provider to use for this remote.',
            controlOptions: {},
        }),
        {
            type: 'Label',
            text: 'Documentation Link',
            options: {
                description:
                    'For more information, refer to the [RClone Config Documentation](https://rclone.org/commands/rclone_config/).',
            },
        } as LabelElement,
        createLabeledControl({
            scope: '#/properties/showAdvanced',
            label: 'Show Advanced Options',
            description: 'Display additional configuration options for experts.',
            controlOptions: {
                toggle: true,
            },
            layoutOptions: {
                style: 'margin-top: 1em;',
            },
        }),
    ];

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
        showAdvanced: {
            type: 'boolean',
            title: 'Show Advanced Options',
            description: 'Whether to show advanced configuration options.',
            default: false,
        },
    };

    const verticalLayoutElement: UIElement = {
        type: 'VerticalLayout',
        elements: basicConfigElements,
        options: { step: 0 },
    };

    return {
        properties: basicConfigProperties as unknown as DataSlice,
        elements: [verticalLayoutElement],
    };
}

/**
 * Step 1/2: Provider-specific configuration (standard or advanced).
 * Returns a SettingSlice containing properties and a VerticalLayout UI element with options.step = stepIndex.
 */
export function getProviderConfigSlice({
    selectedProvider,
    providerOptions,
    isAdvancedStep, // Flag to determine if this is for the advanced step
    stepIndex,
}: {
    selectedProvider: string;
    providerOptions: RCloneProviderOptionResponse[];
    isAdvancedStep: boolean; // True if fetching advanced options, false for standard
    stepIndex: number; // Required step index for the rule
}): SettingSlice {
    // Default properties when no provider is selected
    const configProperties: DataSlice = {};

    if (!selectedProvider || !providerOptions || providerOptions.length === 0) {
        return {
            properties: configProperties,
            elements: [], // Return empty elements if no provider or options
        };
    }

    // Filter options based on whether we are fetching standard or advanced options
    const filteredOptions = providerOptions.filter((option) => {
        // If fetching advanced, include only options marked as Advanced
        if (isAdvancedStep) {
            return option.Advanced === true;
        }
        // If fetching standard, include only options *not* marked as Advanced
        else {
            return option.Advanced !== true;
        }
    });

    // Ensure uniqueness based on Name *within this slice* to prevent overwrites
    const uniqueOptionsByName = filteredOptions.reduce((acc, current) => {
        if (!acc.find((item) => item.Name === current.Name)) {
            acc.push(current);
        } else {
            console.warn(
                `Duplicate RClone option name skipped in ${isAdvancedStep ? 'advanced' : 'standard'} slice: ${current.Name}`
            );
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
    const controlElements = uniqueOptionsByName
        // Filter out elements that are always hidden (Hide=1 without a provider filter)
        .filter((option) => {
            const providerFilter = option.Provider?.trim();
            return !(option.Hide === 1 && !providerFilter);
        })
        .map((option): UIElement => {
            const format = getJsonFormElementForType({
                rcloneType: option.Type,
                examples: option.Examples?.map((example) => example.Value),
                isPassword: option.IsPassword,
            });

            const controlOptions: Record<string, any> = {
                placeholder: option.Default?.toString() || '',
                // help: option.Help || '', // Help/Description should now be part of the control options for tooltip/aria
                required: option.Required || false,
                format, // Pass format hint
                // hide: option.Hide === 1, // Hiding is handled by the rule effect below if needed, or potentially JSON Forms renderer behavior
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
                // Check if the underlying type is boolean, handle undefined option.Type
                const isBooleanType = getJsonSchemaType(option.Type ?? '') === 'boolean';
                controlOptions.suggestions = option.Examples.map((example) => ({
                    // Parse string "true"/"false" to boolean if the type is boolean, handle potential null/undefined
                    value: isBooleanType
                        ? String(example.Value ?? '').toLowerCase() === 'true'
                        : example.Value,
                    // Ensure label is also a string, even if value is null/undefined
                    label: String(example.Value ?? ''),
                    tooltip: example.Help || '',
                }));
            }

            // --- Start: Add dynamic visibility rule based on Provider --- //
            let providerRule: Rule | undefined = undefined; // Define rule type explicitly
            const providerFilter = option.Provider?.trim();

            if (providerFilter) {
                const isNegated = providerFilter.startsWith('!');
                const providers = (isNegated ? providerFilter.substring(1) : providerFilter)
                    .split(',')
                    .map((p) => p.trim())
                    .filter((p) => p);

                if (providers.length > 0) {
                    const conditionSchema = isNegated
                        ? { not: { enum: providers } }
                        : { enum: providers };

                    // Show/Hide logic: If option.Hide === 1, we HIDE, otherwise default SHOW based on provider type
                    const effect = option.Hide === 1 ? RuleEffect.HIDE : RuleEffect.SHOW;

                    providerRule = {
                        effect: effect,
                        condition: {
                            scope: '#/properties/type',
                            schema: conditionSchema,
                        } as SchemaBasedCondition,
                    };
                }
            } else if (option.Hide === 1) {
                // If no provider filter, but Hide is set, create a rule to always hide
                // This needs a condition that is always true, which is tricky.
                // A simple approach is a condition that will likely always evaluate based on the schema.
                // Alternatively, rely on JSON Forms renderer interpretation of a missing rule but Hide=1 property.
                // For robustness, let's add a rule that hides if the field itself exists (which it always will if rendered).
                // Note: This specific 'always hide' might need adjustment based on JSON Forms implementation details.
                // A more direct approach might be filtering these out *before* mapping if always hidden.
                // Let's assume for now `option.Hide=1` without a provider filter means it's *always* hidden.
                // We can filter these out instead of creating a complex rule.
                // Revisit this if hidden fields without provider filters are needed dynamically.

                // --- Simplified Logic: Filter out permanently hidden fields ---
                if (option.Hide === 1 && !providerFilter) {
                    // Skip creating a UI element for this option entirely
                    // This case is now handled by the filter above
                }
            }
            // --- End: Add dynamic visibility rule based on Provider --- //

            // --- Use the helper function ---
            const labeledControl = createLabeledControl({
                scope: `#/properties/parameters/properties/${option.Name}`,
                // Use Name as fallback label if Help is empty, otherwise use Help for label
                label: option.Name, // Use Name for the label text
                description: option.Help || undefined,
                controlOptions: controlOptions,
                rule: providerRule, // Apply the rule to the HorizontalLayout wrapper
            });

            // Layout is a valid UIElement, no cast needed if filter handles nulls
            return labeledControl;
        });

    // Create dynamic properties schema based on unique provider options
    const paramProperties: Record<string, JsonSchema7> = {};
    uniqueOptionsByName.forEach((option) => {
        if (option) {
            paramProperties[option.Name] = translateRCloneOptionToJsonSchema({ option });
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
        elements: controlElements, // Use the refactored elements
        options: { step: stepIndex, showDividers: true }, // Assign stepIndex and add showDividers
    };

    return {
        properties: configProperties,
        elements: [verticalLayoutElement], // Return the VerticalLayout as the single element
    };
}

/**
 * Helper function to convert RClone type to a basic JSON Schema type string (e.g., 'string', 'number', 'boolean').
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
        case 'size':
            // Schema type 'integer'/'number' is sufficient.
            // UI framework should infer NumberField from schema type.
            return undefined;
        case 'sizesuffix':
            return undefined; // Use default InputField (via isStringControl)
        case 'duration':
            return undefined; // Use default InputField (via isStringControl)
        case 'bool':
            // ALWAYS use checkbox/toggle for boolean fields, regardless of examples.
            // RClone examples ("true"/"false") don't map well to UI boolean controls.
            return 'toggle';
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
    showAdvanced = false,
}: {
    providerTypes?: string[];
    selectedProvider?: string;
    providerOptions?: Record<string, RCloneProviderOptionResponse[]>;
    showAdvanced?: boolean;
}): {
    dataSchema: { properties: DataSlice; type: 'object' };
    uiSchema: Layout;
} {
    const optionsForProvider = providerOptions[selectedProvider] || [];
    const slicesToMerge: SettingSlice[] = [];

    // Step 0: Basic Config (Always included)
    const basicSlice = getBasicConfigSlice({ providerTypes });
    slicesToMerge.push(basicSlice);

    // Step 1: Standard Provider Config (Always included if provider selected)
    if (selectedProvider && optionsForProvider.length > 0) {
        const standardConfigSlice = getProviderConfigSlice({
            selectedProvider,
            providerOptions: optionsForProvider,
            isAdvancedStep: false, // Fetch standard options
            stepIndex: 1,
        });
        // Only add if there are actual standard options
        if (
            standardConfigSlice.elements.length > 0 ||
            Object.keys(standardConfigSlice.properties).length > 0
        ) {
            slicesToMerge.push(standardConfigSlice);
        }
    }

    // Step 2: Advanced Provider Config (Conditionally included)
    let advancedConfigSlice: SettingSlice | null = null;
    if (showAdvanced && selectedProvider && optionsForProvider.length > 0) {
        advancedConfigSlice = getProviderConfigSlice({
            selectedProvider,
            providerOptions: optionsForProvider,
            isAdvancedStep: true, // Fetch advanced options
            stepIndex: 2,
        });
        // Only add if there are actual advanced options
        if (
            advancedConfigSlice.elements.length > 0 ||
            Object.keys(advancedConfigSlice.properties).length > 0
        ) {
            slicesToMerge.push(advancedConfigSlice);
        }
    }

    // Merge all relevant slices
    const mergedSlices = mergeSettingSlices(slicesToMerge);

    // Construct the final dataSchema
    // Add explicit type annotation to satisfy stricter type checking
    const dataSchema: { properties: DataSlice; type: 'object' } = {
        type: 'object',
        properties: mergedSlices.properties,
        // Add required fields if necessary, e.g., ['name', 'type']
        // required: ['name', 'type'], // Example: Make name and type required globally
    };

    // --- UI Schema Definition ---

    // Define steps based on whether advanced options are shown
    const steps = [{ label: 'Set up Remote Config', description: 'Name and provider selection' }];

    if (selectedProvider) {
        steps.push({ label: 'Set up Drive', description: 'Provider-specific configuration' });
    }
    if (
        showAdvanced &&
        advancedConfigSlice &&
        (advancedConfigSlice.elements.length > 0 ||
            Object.keys(advancedConfigSlice.properties).length > 0)
    ) {
        steps.push({ label: 'Advanced Config', description: 'Optional advanced settings' });
    }

    // Define the SteppedLayout UI element
    const steppedLayoutElement: UIElement = {
        type: 'SteppedLayout',
        options: {
            steps: steps, // Use dynamically generated steps
        },
        // Nest the step content elements directly inside the SteppedLayout
        elements: mergedSlices.elements,
    };

    // Define the overall title label
    const titleLabel: UIElement = {
        type: 'Label',
        text: 'Configure RClone Remote',
        options: {
            format: 'title',
            description:
                'This 3-step process will guide you through setting up your RClone remote configuration.',
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
