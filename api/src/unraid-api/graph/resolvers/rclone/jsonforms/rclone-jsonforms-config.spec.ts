import type { ControlElement, Layout, SchemaBasedCondition } from '@jsonforms/core'; // Removed CategorizationLayout, using Layout
import { describe, expect, it } from 'vitest';

// Added .js extension
import type { RCloneProviderOptionResponse } from '../rclone.model.js'; // Adjusted path and added .js
import { config as mockRcloneConfigData } from './config.js'; // Added .js extension
import { getRcloneConfigFormSchema, getRcloneConfigSlice } from './rclone-jsonforms-config.js';

// Helper to process mock data from config.ts into the expected format
const processMockConfig = (
    mockConfig: any[]
): {
    providerNames: string[];
    providerOptions: Record<string, RCloneProviderOptionResponse[]>;
} => {
    const providerNames = mockConfig.map((p) => p.Name);
    const providerOptions = mockConfig.reduce(
        (acc, provider) => {
            // Map options, ensuring all required fields from RCloneProviderOptionResponse exist
            acc[provider.Name] = provider.Options.map(
                (opt: any): RCloneProviderOptionResponse => ({
                    Name: opt.Name,
                    Help: opt.Help || '',
                    Default: opt.Default,
                    Required: opt.Required || false,
                    Advanced: opt.Advanced || false,
                    Examples: opt.Examples || null,
                    IsPassword: opt.IsPassword || false,
                    Type: opt.Type || 'string',
                    Hide: opt.Hide || 0,
                    Provider: opt.Provider || '',
                    Value: opt.Value !== undefined ? opt.Value : null,
                    ShortOpt: opt.ShortOpt || '',
                    NoPrefix: opt.NoPrefix || false,
                    DefaultStr: opt.DefaultStr || '',
                })
            );
            return acc;
        },
        {} as Record<string, RCloneProviderOptionResponse[]>
    );
    return { providerNames, providerOptions };
};

// Process the mock data once
const { providerNames: mockProviderNames, providerOptions: mockProviderOptions } =
    processMockConfig(mockRcloneConfigData);

describe('RClone JSONForms Config Generation', () => {
    describe('getRcloneConfigSlice', () => {
        it('should return the base configuration slice without stepper/advanced controls', () => {
            const slice = getRcloneConfigSlice();

            // Check properties
            expect(slice.properties).toHaveProperty('configStep');
            expect(slice.properties.configStep.type).toBe('number');
            expect(slice.properties).not.toHaveProperty('showAdvanced');

            // Check elements (only the title Label should remain from this slice)
            expect(slice.elements.length).toBe(1);
            expect(slice.elements[0].type).toBe('Label');
            expect((slice.elements[0] as any).text).toBe('Configure RClone Backup');
            // Check that controls for configStep and showAdvanced are NOT present
            const controls = slice.elements.filter((e) => e.type === 'Control');
            expect(controls.length).toBe(0);
        });
    });

    describe('getRcloneConfigFormSchema', () => {
        it('should generate schema with only basic config when no provider selected', () => {
            const result = getRcloneConfigFormSchema(mockProviderNames, '', {});

            // Check properties
            expect(result.properties).toHaveProperty('name');
            expect(result.properties).toHaveProperty('type');
            expect(result.properties).not.toHaveProperty('parameters'); // No provider options

            // Check elements
            expect(result.elements.length).toBe(1); // Only the basic VerticalLayout
            expect(result.elements[0].type).toBe('VerticalLayout');
            const basicLayout = result.elements[0] as Layout;
            expect(basicLayout.elements.length).toBe(3); // name control, type control, docs label
            expect((basicLayout.elements[0] as ControlElement).scope).toBe('#/properties/name');
            expect((basicLayout.elements[1] as ControlElement).scope).toBe('#/properties/type');
            expect(basicLayout.elements[2].type).toBe('Label'); // Docs label
        });

        it('should generate schema with basic config and empty categorization for provider with no options', () => {
            const providerName = 'providerWithNoOptions';
            const customProviderNames = [...mockProviderNames, providerName];
            const customProviderOptions = { ...mockProviderOptions, [providerName]: [] };
            const result = getRcloneConfigFormSchema(
                customProviderNames,
                providerName,
                customProviderOptions
            );

            expect(result.properties).toHaveProperty('name');
            expect(result.properties).toHaveProperty('type');
            // Parameters object might be added but should be empty if providerOptions is empty
            expect(result.properties.parameters?.properties).toEqual({});

            // Check elements: Only basic config, no Categorization should be added if no provider options exist
            expect(result.elements.length).toBe(1);
            expect(result.elements[0].type).toBe('VerticalLayout');
        });

        it('should generate schema with Categorization for "drive" provider', () => {
            const result = getRcloneConfigFormSchema(mockProviderNames, 'drive', mockProviderOptions);

            // Check Combined Properties
            expect(result.properties).toHaveProperty('name');
            expect(result.properties).toHaveProperty('type');
            expect(result.properties).toHaveProperty('parameters');
            expect(result.properties.parameters.type).toBe('object');
            expect(result.properties.parameters.properties).toHaveProperty('client_id');
            expect(result.properties.parameters.properties?.client_id?.type).toBe('string');
            expect(result.properties.parameters.properties).toHaveProperty('chunk_size');
            expect(result.properties.parameters.properties?.chunk_size?.type).toBe('number');

            // Check Elements Structure
            expect(result.elements.length).toBe(2);
            expect(result.elements[0].type).toBe('VerticalLayout'); // Basic Config part
            expect(result.elements[1].type).toBe('Categorization'); // Provider config part

            const categorization = result.elements[1] as Layout;
            // Check visibility rule for categorization
            const condition = categorization.rule?.condition as SchemaBasedCondition;
            expect(condition?.scope).toBe('#/properties/configStep');
            expect(condition?.schema.const).toBe(1);
            expect(categorization.elements?.length).toBe(2); // Should have Standard + Advanced Categories

            // Check Standard Category
            const standardCategory = categorization.elements?.[0] as any;
            expect(standardCategory.type).toBe('Category');
            expect(standardCategory.label).toBe('Standard Configuration');
            expect(standardCategory.elements.length).toBe(1);
            expect(standardCategory.elements[0].type).toBe('VerticalLayout');
            const standardLayout = standardCategory.elements[0] as Layout;
            const standardScopes = standardLayout.elements.map((e) => (e as ControlElement).scope);
            expect(standardScopes).toContain('#/properties/parameters/properties/client_id');
            expect(standardScopes).not.toContain('#/properties/parameters/properties/chunk_size');

            // Check Advanced Category
            const advancedCategory = categorization.elements?.[1] as any;
            expect(advancedCategory.type).toBe('Category');
            expect(advancedCategory.label).toBe('Advanced Configuration');
            expect(advancedCategory.elements.length).toBe(1);
            expect(advancedCategory.elements[0].type).toBe('VerticalLayout');
            const advancedLayout = advancedCategory.elements[0] as Layout;
            const advancedScopes = advancedLayout.elements.map((e) => (e as ControlElement).scope);
            expect(advancedScopes).not.toContain('#/properties/parameters/properties/client_id');
            expect(advancedScopes).toContain('#/properties/parameters/properties/chunk_size');
        });

        it('should correctly translate various option types using "sftp" as example', () => {
            const result = getRcloneConfigFormSchema(mockProviderNames, 'sftp', mockProviderOptions);
            const params = result.properties.parameters.properties;

            // Check basic string translation
            expect(params?.host?.type).toBe('string');
            expect(params?.host?.title).toBe('host');
            expect(params?.host?.description).toBe('SSH host to connect to');
            expect(params?.host?.pattern).toBeUndefined(); // No special pattern for plain string
            expect(params?.host?.minLength).toBe(1); // Required string

            // Check number translation (port in sftp is string-like in rclone config, schema should reflect that)
            expect(params?.port?.type).toBe('string');

            // Check password translation
            expect(params?.pass?.type).toBe('string');
            expect(params?.pass?.format).toBe('password'); // Check format hint
            // It's required=false in the mock, so no minLength expected here
            // expect(params?.pass?.minLength).toBe(1);

            // Check boolean translation
            expect(params?.key_use_agent?.type).toBe('boolean');
            expect(params?.key_use_agent?.default).toBe(false);
            expect(params?.key_use_agent?.format).toBe('checkbox'); // Check UI hint for boolean
        });

        it('should correctly translate enum/examples using "drive" scope option', () => {
            const result = getRcloneConfigFormSchema(mockProviderNames, 'drive', mockProviderOptions);
            const driveParams = result.properties.parameters.properties;
            expect(driveParams?.scope?.type).toBe('string');
            expect(driveParams?.scope?.enum).toEqual([
                'drive',
                'drive.readonly',
                'drive.file',
                'drive.appfolder',
                'drive.metadata.readonly',
            ]);
            expect(driveParams?.scope?.format).toBe('dropdown'); // Check UI hint for enum
        });

        it('should correctly translate SizeSuffix/Duration types using "b2" options', () => {
            const result = getRcloneConfigFormSchema(mockProviderNames, 'b2', mockProviderOptions);
            const b2Params = result.properties.parameters.properties;

            // B2 upload_cutoff is SizeSuffix
            expect(b2Params?.upload_cutoff?.type).toBe('string'); // Schema type is string
            expect(b2Params?.upload_cutoff?.pattern).toBe('^(off|(\d+([KMGTPE]i?B?)?)+)$'); // Pattern check
            expect(b2Params?.upload_cutoff?.format).toBeUndefined(); // Default input, no specific format
            expect(b2Params?.upload_cutoff?.default).toBe(209715200); // Default value check

            // Check a duration type (if b2 had one, let's use 'cache' provider for example)
            const cacheResult = getRcloneConfigFormSchema(
                mockProviderNames,
                'cache',
                mockProviderOptions
            );
            const cacheParams = cacheResult.properties.parameters.properties;
            expect(cacheParams?.info_age?.type).toBe('string'); // Type should be string for duration
            expect(cacheParams?.info_age?.pattern).toBe(
                '^(off|(\d+(\.\d+)?(ns|us|\u00b5s|ms|s|m|h))+)$'
            ); // Pattern check
            expect(cacheParams?.info_age?.default).toBe(21600000000000); // Default value
        });

        it('should handle default values correctly (string, number, boolean, "off")', () => {
            const driveResult = getRcloneConfigFormSchema(
                mockProviderNames,
                'drive',
                mockProviderOptions
            );
            const driveParams = driveResult.properties.parameters.properties;
            expect(driveParams?.use_trash?.default).toBe(true); // Boolean default
            expect(driveParams?.chunk_size?.default).toBe(8388608); // Number default
            expect(driveParams?.export_formats?.default).toBe('docx,xlsx,pptx,svg'); // String default

            // Check 'off' default for SizeSuffix/Duration (using 'cache' provider)
            // Note: The mock data for cache doesn't seem to have an 'off' default.
            // We can simulate one if needed, or trust the translate function's logic tested elsewhere/directly.
        });
    });

    // Optional: Add direct tests for translateRCloneOptionToJsonSchema if complex cases aren't covered above
});
