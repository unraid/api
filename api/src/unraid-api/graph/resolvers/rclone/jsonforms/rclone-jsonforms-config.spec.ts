import type { JsonSchema7, Layout, SchemaBasedCondition } from '@jsonforms/core';
import { beforeEach, describe, expect, it } from 'vitest';

// Adjusted path assuming rclone.model.ts is sibling to jsonforms dir
import type { RCloneProviderOptionResponse } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { config as rawProviderConfig } from '@app/unraid-api/graph/resolvers/rclone/jsonforms/config.js'; // Added .js extension
import { getProviderConfigSlice } from '@app/unraid-api/graph/resolvers/rclone/jsonforms/rclone-jsonforms-config.js'; // Added .js extension

// Placeholder type for UIElement if the original path doesn't resolve in tests
// Make placeholder more specific to include expected properties
type UIElement = {
    type: string;
    scope: string;
    label: string;
    options?: Record<string, any>;
    rule?: {
        effect: string; // RuleEffect is an enum, use string for simplicity in test type
        condition: SchemaBasedCondition & {
            // Assert that it's SchemaBased
            scope: string;
            schema: JsonSchema7;
        };
    };
    // Add other potential properties if needed
    [key: string]: any; // Allow other properties
};
// import type { UIElement } from '@app/unraid-api/types/json-forms'; // Original import commented out

// --- Data Processing ---

// Type assertion for the imported config
interface RawProviderConfigEntry {
    Name: string;
    Options: RCloneProviderOptionResponse[];
    // Add other properties from config.ts if needed, though Name and Options are primary
}

// Process the raw config into the format expected by the functions under test
const providerOptionsMap: Record<string, RCloneProviderOptionResponse[]> = (
    rawProviderConfig as RawProviderConfigEntry[]
).reduce(
    (acc, provider) => {
        if (provider.Name && Array.isArray(provider.Options)) {
            // Ensure options conform to the expected type structure if necessary
            // For now, we assume the structure matches RCloneProviderOptionResponse
            acc[provider.Name] = provider.Options;
        }
        return acc;
    },
    {} as Record<string, RCloneProviderOptionResponse[]>
);

const providerNames = Object.keys(providerOptionsMap);

// --- Test Suite ---

describe('getProviderConfigSlice', () => {
    // Example provider to use in tests - choose one with both standard and advanced options
    const testProvider = 's3'; // S3 usually has a good mix
    let s3Options: RCloneProviderOptionResponse[];

    beforeEach(() => {
        // Ensure we have the options for the test provider
        s3Options = providerOptionsMap[testProvider];
        expect(s3Options).toBeDefined();
        expect(s3Options.length).toBeGreaterThan(0);
    });

    it('should return an empty slice if the provider name is invalid', () => {
        const result = getProviderConfigSlice({
            selectedProvider: 'invalid-provider-name',
            providerOptions: [], // Doesn't matter for this case
            isAdvancedStep: false,
            stepIndex: 1,
        });
        expect(result.properties).toEqual({});
        expect(result.elements).toEqual([]);
    });

    it('should return an empty slice if providerOptions are empty', () => {
        const result = getProviderConfigSlice({
            selectedProvider: testProvider, // Valid provider
            providerOptions: [], // Empty options
            isAdvancedStep: false,
            stepIndex: 1,
        });
        expect(result.properties).toEqual({});
        expect(result.elements).toEqual([]);
    });

    it("should return only standard options when isAdvancedStep is false", () => {
        const result = getProviderConfigSlice({
            selectedProvider: testProvider,
            providerOptions: s3Options,
            isAdvancedStep: false,
            stepIndex: 1,
        });

        // Check properties schema
        expect(result.properties).toBeDefined();
        expect(result.properties.parameters).toBeDefined();
        const paramProps = result.properties.parameters?.properties || {};
        expect(Object.keys(paramProps).length).toBeGreaterThan(0);

        // Check that all properties included are standard (Advanced !== true)
        const standardOptions = s3Options.filter((opt) => opt.Advanced !== true);
        const uniqueStandardOptionNames = [...new Set(standardOptions.map((opt) => opt.Name))];

        // Assert against the count of UNIQUE standard option names
        expect(Object.keys(paramProps).length).toEqual(uniqueStandardOptionNames.length);

        // Check that each unique standard option name exists in the generated props
        uniqueStandardOptionNames.forEach((name) => {
            expect(paramProps[name]).toBeDefined();
            // Find the first option with this name to check title (or implement more complex logic if needed)
            const correspondingOption = standardOptions.find((opt) => opt.Name === name);
            expect(paramProps[name]?.title).toEqual(correspondingOption?.Name);
        });

        // Check UI elements - compare count against unique names
        expect(result.elements).toBeDefined();
        // Expect a single VerticalLayout containing the actual elements
        expect(result.elements).toHaveLength(1);
        const verticalLayoutStd = result.elements[0];
        expect(verticalLayoutStd.type).toBe('VerticalLayout');
        expect(Array.isArray(verticalLayoutStd.elements)).toBe(true);
        expect(verticalLayoutStd.elements.length).toEqual(uniqueStandardOptionNames.length);

        // Check elements based on unique names
        uniqueStandardOptionNames.forEach((name) => {
            // Use `as any` for type assertion on the result elements array
            // Adjust to check within the VerticalLayout's elements
            const elementsArray = verticalLayoutStd.elements as any[];
            // Find element by scope instead of label
            const expectedScope = `#/properties/parameters/properties/${name}`;
            const element = elementsArray.find((el) => el.scope === expectedScope);
            expect(element).toBeDefined(); // Check if element was found
            if (element) {
                // Check the type of the wrapper layout
                expect(element.type).toEqual('UnraidSettingsLayout');
            }
        });
    });

    it("should return only advanced options when isAdvancedStep is true", () => {
        const result = getProviderConfigSlice({
            selectedProvider: testProvider,
            providerOptions: s3Options,
            isAdvancedStep: true,
            stepIndex: 2,
        });

        // Check properties schema
        expect(result.properties).toBeDefined();
        expect(result.properties.parameters).toBeDefined();
        const paramProps = result.properties.parameters?.properties || {};
        expect(Object.keys(paramProps).length).toBeGreaterThan(0);

        // Check that all properties included are advanced (Advanced === true)
        const advancedOptions = s3Options.filter((opt) => opt.Advanced === true);
        const uniqueAdvancedOptionNames = [...new Set(advancedOptions.map((opt) => opt.Name))];

        // Assert against the count of UNIQUE advanced option names
        expect(Object.keys(paramProps).length).toEqual(uniqueAdvancedOptionNames.length);

        // Check that each unique advanced option name exists in the generated props
        uniqueAdvancedOptionNames.forEach((name) => {
            expect(paramProps[name]).toBeDefined();
            const correspondingOption = advancedOptions.find((opt) => opt.Name === name);
            expect(paramProps[name]?.title).toEqual(correspondingOption?.Name);
        });

        // Check UI elements - compare count against unique names
        expect(result.elements).toBeDefined();
        // Expect a single VerticalLayout containing the actual elements
        expect(result.elements).toHaveLength(1);
        const verticalLayoutAdv = result.elements[0];
        expect(verticalLayoutAdv.type).toBe('VerticalLayout');
        expect(Array.isArray(verticalLayoutAdv.elements)).toBe(true);
        expect(verticalLayoutAdv.elements.length).toEqual(uniqueAdvancedOptionNames.length);

        // Check elements based on unique names
        uniqueAdvancedOptionNames.forEach((name) => {
            // Use `as any` for type assertion on the result elements array
            // Adjust to check within the VerticalLayout's elements
            const elementsArray = verticalLayoutAdv.elements as any[];
            // Find element by scope instead of label
            const expectedScope = `#/properties/parameters/properties/${name}`;
            const element = elementsArray.find((el) => el.scope === expectedScope);
            expect(element).toBeDefined(); // Check if element was found
            if (element) {
                // Check the type of the wrapper layout
                expect(element.type).toEqual('UnraidSettingsLayout');
            }
        });
    });

    it('should return an empty slice for advanced options if none exist for the provider', () => {
        const testProviderNoAdvanced = 'alias'; // 'alias' provider typically has no advanced options
        const aliasOptions = providerOptionsMap[testProviderNoAdvanced];

        // Pre-check: Verify that the chosen provider actually has no advanced options in our data
        const hasAdvanced = aliasOptions?.some((opt) => opt.Advanced === true);
        expect(hasAdvanced).toBe(false); // Ensure our assumption about 'alias' holds

        const result = getProviderConfigSlice({
            selectedProvider: testProviderNoAdvanced,
            providerOptions: aliasOptions || [],
            isAdvancedStep: true,
            stepIndex: 2,
        });

        // Expect empty results because no advanced options should be found
        expect(result.properties).toEqual({}); // Should not even have parameters object
        expect(result.elements).toEqual([]);
    });

    it('should handle duplicate option names within the same type (standard/advanced)', () => {
        const duplicateOptions: RCloneProviderOptionResponse[] = [
            { Name: 'test_opt', Help: 'First', Advanced: false, Provider: '' },
            { Name: 'duplicate_opt', Help: 'Keep this one', Advanced: false, Provider: '' },
            { Name: 'duplicate_opt', Help: 'Skip this one', Advanced: false, Provider: '' },
            { Name: 'another_opt', Help: 'Another', Advanced: false, Provider: '' },
        ];

        const result = getProviderConfigSlice({
            selectedProvider: 'test',
            providerOptions: duplicateOptions,
            isAdvancedStep: false,
            stepIndex: 1,
        });

        // Check properties - should only contain unique names
        const paramProps = result.properties.parameters?.properties || {};
        expect(Object.keys(paramProps)).toEqual(['test_opt', 'duplicate_opt', 'another_opt']);
        expect(paramProps['duplicate_opt']?.description).toBe('Keep this one'); // Check it kept the first one

        // Check elements - should only contain unique names
        // Expect a single VerticalLayout containing the actual elements
        expect(result.elements).toHaveLength(1);
        const verticalLayoutDup = result.elements[0];
        expect(verticalLayoutDup.type).toBe('VerticalLayout');
        expect(Array.isArray(verticalLayoutDup.elements)).toBe(true);
        expect(verticalLayoutDup.elements.length).toBe(3);

        // Adjusted check to find label within the UnraidSettingsLayout
        const foundDuplicateElement = verticalLayoutDup.elements.find(
            (el: any) => el.scope?.includes('duplicate_opt')
        );
        expect(foundDuplicateElement).toBeDefined();
        // Check the label within the found element's inner elements
        const duplicateLabelElement = foundDuplicateElement?.elements?.find(
            (innerEl: any) => innerEl.type === 'Label'
        );
        // Check the description within the label options
        expect(duplicateLabelElement?.options?.description).toBe('Keep this one');
        // Check that the other duplicate label is not present by description
        const containsSkipped = verticalLayoutDup.elements.some((el: any) =>
            el.elements?.some(
                (innerEl: any) =>
                    innerEl.type === 'Label' && innerEl.options?.description === 'Skip this one'
            )
        );
        expect(containsSkipped).toBe(false);
    });

    it('should add a SHOW rule for positive Provider filters', () => {
        const providerSpecificOptions: RCloneProviderOptionResponse[] = [
            { Name: 'always_show', Help: 'Always Visible', Provider: '' },
            { Name: 's3_only', Help: 'S3 Specific', Provider: 's3' },
            { Name: 'gdrive_only', Help: 'GDrive Specific', Provider: 'google drive' }, // Check space handling
        ];

        const result = getProviderConfigSlice({
            selectedProvider: 'anyProvider',
            providerOptions: providerSpecificOptions,
            isAdvancedStep: false,
            stepIndex: 1,
        });

        // Expect a single VerticalLayout containing the actual elements
        expect(result.elements).toHaveLength(1);
        const verticalLayoutPos = result.elements[0];
        expect(verticalLayoutPos.type).toBe('VerticalLayout');
        expect(verticalLayoutPos.elements.length).toBe(3);

        const alwaysShowEl = verticalLayoutPos.elements.find((el: any) => el.scope.includes('always_show'));
        const s3OnlyEl = verticalLayoutPos.elements.find((el: any) => el.scope.includes('s3_only'));
        const gdriveOnlyEl = verticalLayoutPos.elements.find((el: any) => el.scope.includes('gdrive_only'));

        expect(alwaysShowEl).toBeDefined();
        expect(s3OnlyEl).toBeDefined();
        expect(gdriveOnlyEl).toBeDefined();

        expect(alwaysShowEl!.rule).toBeUndefined();

        expect(s3OnlyEl!.rule).toBeDefined();
        expect(s3OnlyEl!.rule!.effect).toBe('SHOW');
        // Explicitly cast condition to SchemaBasedCondition
        const s3Condition = s3OnlyEl!.rule!.condition as SchemaBasedCondition;
        expect(s3Condition.scope).toBe('#/properties/type');
        expect(s3Condition.schema).toEqual({ enum: ['s3'] });

        expect(gdriveOnlyEl!.rule).toBeDefined();
        expect(gdriveOnlyEl!.rule!.effect).toBe('SHOW');
        // Explicitly cast condition to SchemaBasedCondition
        const gdriveCondition = gdriveOnlyEl!.rule!.condition as SchemaBasedCondition;
        expect(gdriveCondition.scope).toBe('#/properties/type');
        expect(gdriveCondition.schema).toEqual({ enum: ['google drive'] });
    });

    it('should add a SHOW rule with negated condition for negative Provider filters', () => {
        const providerSpecificOptions: RCloneProviderOptionResponse[] = [
            { Name: 'not_s3', Help: 'Not S3', Provider: '!s3' },
            {
                Name: 'not_s3_or_gdrive',
                Help: 'Not S3 or GDrive',
                Provider: '!s3, google drive ',
            }, // Check trimming
        ];

        const result = getProviderConfigSlice({
            selectedProvider: 'anyProvider',
            providerOptions: providerSpecificOptions,
            isAdvancedStep: false,
            stepIndex: 1,
        });

        // Expect a single VerticalLayout containing the actual elements
        expect(result.elements).toHaveLength(1);
        const verticalLayoutNeg = result.elements[0];
        expect(verticalLayoutNeg.type).toBe('VerticalLayout');
        expect(verticalLayoutNeg.elements.length).toBe(2);

        const notS3El = verticalLayoutNeg.elements.find((el: any) => el.scope.includes('not_s3'));
        const notS3OrGDriveEl = verticalLayoutNeg.elements.find((el: any) =>
            el.scope.includes('not_s3_or_gdrive')
        );

        expect(notS3El).toBeDefined();
        expect(notS3OrGDriveEl).toBeDefined();

        expect(notS3El!.rule).toBeDefined();
        expect(notS3El!.rule!.effect).toBe('SHOW');
        // Explicitly cast condition to SchemaBasedCondition
        const notS3Condition = notS3El!.rule!.condition as SchemaBasedCondition;
        expect(notS3Condition.scope).toBe('#/properties/type');
        expect(notS3Condition.schema).toEqual({ not: { enum: ['s3'] } });

        expect(notS3OrGDriveEl!.rule).toBeDefined();
        expect(notS3OrGDriveEl!.rule!.effect).toBe('SHOW');
        // Explicitly cast condition to SchemaBasedCondition
        const notS3OrGDriveCondition = notS3OrGDriveEl!.rule!.condition as SchemaBasedCondition;
        expect(notS3OrGDriveCondition.scope).toBe('#/properties/type');
        expect(notS3OrGDriveCondition.schema).toEqual({ not: { enum: ['s3', 'google drive'] } });
    });

    // More tests will be added here...
});
