import type { LabelElement, Layout, Rule, SchemaBasedCondition } from '@jsonforms/core';
import { JsonSchema7, RuleEffect } from '@jsonforms/core';

import type { DataSlice, SettingSlice, UIElement } from '@app/unraid-api/types/json-forms.js';
import { RCloneProviderOptionResponse } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { createLabeledControl } from '@app/unraid-api/graph/utils/form-utils.js';
import { mergeSettingSlices } from '@app/unraid-api/types/json-forms.js';

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

    if (option.Default !== undefined && option.Default !== '') {
        if ((option.Type === 'SizeSuffix' || option.Type === 'Duration') && option.Default === 'off') {
            schema.default = 'off';
        } else if (schema.type === 'number' && typeof option.Default === 'number') {
            schema.default = option.Default;
        } else if (schema.type === 'integer' && Number.isInteger(option.Default)) {
            schema.default = option.Default;
        } else if (schema.type === 'boolean' && typeof option.Default === 'boolean') {
            schema.default = option.Default;
        } else if (schema.type === 'string') {
            schema.default = String(option.Default);
        }
    }

    const format = getJsonFormElementForType({
        rcloneType: option.Type,
        examples: option.Examples?.map((example) => example.Value),
        isPassword: option.IsPassword,
    });
    if (format && format !== schema.type && format !== 'combobox') {
        schema.format = format;
    }

    if (option.Required) {
        if (schema.type === 'string') {
            schema.minLength = 1;
        }
    }

    switch (option.Type?.toLowerCase()) {
        case 'int':
            break;
        case 'sizesuffix':
            schema.pattern = '^(off|(\\d+([KMGTPE]i?B?)?)+)$';
            schema.errorMessage = 'Invalid size format. Examples: "10G", "100M", "1.5GiB", "off".';
            break;
        case 'duration':
            schema.pattern = '^(off|(d+(.d+)?(ns|us|\u00b5s|ms|s|m|h))+)$';
            schema.errorMessage =
                'Invalid duration format. Examples: "10s", "1.5m", "100ms", "1h15m", "off".';
            break;
    }

    return schema;
}

function getBasicConfigSlice({ providerTypes }: { providerTypes: string[] }): SettingSlice {
    const basicConfigElements: UIElement[] = [
        createLabeledControl({
            scope: '#/properties/name',
            label: 'Remote Name',
            description:
                'Name to identify this remote configuration (e.g., my_google_drive). Use only letters, numbers, hyphens, and underscores.',
            controlOptions: {
                placeholder: 'Enter a name',
                format: 'string',
            },
        }),

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

export function getProviderConfigSlice({
    selectedProvider,
    providerOptions,
    isAdvancedStep,
    stepIndex,
}: {
    selectedProvider: string;
    providerOptions: RCloneProviderOptionResponse[];
    isAdvancedStep: boolean;
    stepIndex: number;
}): SettingSlice {
    const configProperties: DataSlice = {};

    if (!selectedProvider || !providerOptions || providerOptions.length === 0) {
        return {
            properties: configProperties,
            elements: [],
        };
    }

    const filteredOptions = providerOptions.filter((option) => {
        if (isAdvancedStep) {
            return option.Advanced === true;
        } else {
            return option.Advanced !== true;
        }
    });

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

    if (uniqueOptionsByName.length === 0) {
        return {
            properties: configProperties,
            elements: [],
        };
    }

    const controlElements = uniqueOptionsByName
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
                required: option.Required || false,
                format,
            };

            if (option.Examples && option.Examples.length > 0) {
                const exampleValues = option.Examples.map((example) => example.Value).join(', ');
                controlOptions.placeholder = `e.g., ${exampleValues}`;
            }

            if (format === 'checkbox' && (!option.Examples || option.Examples.length === 0)) {
                controlOptions.toggle = true;
            }

            if (format === 'combobox' && option.Examples && option.Examples.length > 0) {
                const isBooleanType = getJsonSchemaType(option.Type ?? '') === 'boolean';
                controlOptions.suggestions = option.Examples.map((example) => ({
                    value: isBooleanType
                        ? String(example.Value ?? '').toLowerCase() === 'true'
                        : example.Value,
                    label: String(example.Value ?? ''),
                    tooltip: example.Help || '',
                }));
            }

            let providerRule: Rule | undefined = undefined;
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

                    const effect = option.Hide === 1 ? RuleEffect.HIDE : RuleEffect.SHOW;

                    providerRule = {
                        effect: effect,
                        condition: {
                            scope: '#/properties/type',
                            schema: conditionSchema,
                        } as SchemaBasedCondition,
                    };
                }
            }

            const labeledControl = createLabeledControl({
                scope: `#/properties/parameters/properties/${option.Name}`,
                label: option.Name,
                description: option.Help || undefined,
                controlOptions: controlOptions,
                rule: providerRule,
                passScopeToLayout: true,
            });

            return labeledControl;
        });

    const paramProperties: Record<string, JsonSchema7> = {};
    uniqueOptionsByName.forEach((option) => {
        if (option) {
            paramProperties[option.Name] = translateRCloneOptionToJsonSchema({ option });
        }
    });

    if (Object.keys(paramProperties).length > 0) {
        if (!configProperties.parameters) {
            configProperties.parameters = { type: 'object', properties: {} } as any;
        } else if (!(configProperties.parameters as any).properties) {
            (configProperties.parameters as any).properties = {};
        }
        (configProperties.parameters as any).properties = {
            ...(configProperties.parameters as any).properties,
            ...paramProperties,
        };
    }

    const verticalLayoutElement: UIElement = {
        type: 'VerticalLayout',
        elements: controlElements,
        options: { step: stepIndex, showDividers: true },
    };

    return {
        properties: configProperties,
        elements: [verticalLayoutElement],
    };
}

function getJsonSchemaType(rcloneType: string): string {
    switch (rcloneType?.toLowerCase()) {
        case 'int':
            return 'integer';
        case 'size':
        case 'number':
            return 'number';
        case 'sizesuffix':
        case 'duration':
            return 'string';
        case 'bool':
            return 'boolean';
        case 'string':
        case 'text':
        case 'password':
        default:
            return 'string';
    }
}

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
            return undefined;
        case 'sizesuffix':
            return undefined;
        case 'duration':
            return undefined;
        case 'bool':
            return 'toggle';
        case 'text':
            return undefined;
        case 'password':
            return 'password';
        case 'string':
        default:
            if (examples && examples.length > 0) {
                return 'combobox';
            }
            return undefined;
    }
}

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

    const basicSlice = getBasicConfigSlice({ providerTypes });
    slicesToMerge.push(basicSlice);

    if (selectedProvider && optionsForProvider.length > 0) {
        const standardConfigSlice = getProviderConfigSlice({
            selectedProvider,
            providerOptions: optionsForProvider,
            isAdvancedStep: false,
            stepIndex: 1,
        });
        if (
            standardConfigSlice.elements.length > 0 ||
            Object.keys(standardConfigSlice.properties).length > 0
        ) {
            slicesToMerge.push(standardConfigSlice);
        }
    }

    let advancedConfigSlice: SettingSlice | null = null;
    if (showAdvanced && selectedProvider && optionsForProvider.length > 0) {
        advancedConfigSlice = getProviderConfigSlice({
            selectedProvider,
            providerOptions: optionsForProvider,
            isAdvancedStep: true,
            stepIndex: 2,
        });
        if (
            advancedConfigSlice.elements.length > 0 ||
            Object.keys(advancedConfigSlice.properties).length > 0
        ) {
            slicesToMerge.push(advancedConfigSlice);
        }
    }

    const mergedSlices = mergeSettingSlices(slicesToMerge);

    const dataSchema: { properties: DataSlice; type: 'object' } = {
        type: 'object',
        properties: mergedSlices.properties,
    };

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

    const steppedLayoutElement: UIElement = {
        type: 'SteppedLayout',
        options: {
            steps: steps,
        },
        elements: mergedSlices.elements,
    };

    const titleLabel: UIElement = {
        type: 'Label',
        text: 'Configure RClone Remote',
        options: {
            format: 'title',
            description:
                'This process will guide you through setting up your RClone remote configuration.',
        },
    };

    const uiSchema: Layout = {
        type: 'VerticalLayout',
        elements: [titleLabel, steppedLayoutElement],
    };

    return { dataSchema, uiSchema };
}
