import { describe, expect, it } from 'vitest';

import type { DataSlice, SettingSlice, UIElement } from '@app/unraid-api/types/json-forms.js';
import { createEmptySettingSlice, mergeSettingSlices } from '@app/unraid-api/types/json-forms.js';

describe('mergeSettingSlices', () => {
    it('should return an empty slice when merging an empty array', () => {
        const slices: SettingSlice[] = [];
        const expected = createEmptySettingSlice();
        expect(mergeSettingSlices(slices)).toEqual(expected);
    });

    it('should return the same slice when merging a single slice', () => {
        const slice: SettingSlice = {
            properties: { prop1: { type: 'string' } },
            elements: [{ type: 'Control', scope: '#/properties/prop1' }],
        };
        expect(mergeSettingSlices([slice])).toEqual(slice);
    });

    it('should merge properties deeply and concatenate elements for multiple slices', () => {
        const slice1: SettingSlice = {
            properties: {
                prop1: { type: 'string' },
                nested: { type: 'object', properties: { nestedProp1: { type: 'boolean' } } },
            },
            elements: [{ type: 'Control', scope: '#/properties/prop1' } as UIElement],
        };
        const slice2: SettingSlice = {
            properties: {
                prop2: { type: 'number' },
                nested: { type: 'object', properties: { nestedProp2: { type: 'string' } } }, // Overlapping nested property
            },
            elements: [
                { type: 'Control', scope: '#/properties/prop2' } as UIElement,
                { type: 'Label', text: 'Nested' } as UIElement,
            ],
        };

        const expectedProperties: DataSlice = {
            prop1: { type: 'string' },
            prop2: { type: 'number' },
            nested: {
                type: 'object',
                properties: {
                    nestedProp1: { type: 'boolean' },
                    nestedProp2: { type: 'string' },
                },
            },
        };
        const expectedElements: UIElement[] = [
            { type: 'Control', scope: '#/properties/prop1' },
            { type: 'Control', scope: '#/properties/prop2' },
            { type: 'Label', text: 'Nested' },
        ];

        const mergedSlice = mergeSettingSlices([slice1, slice2]);

        expect(mergedSlice.properties).toEqual(expectedProperties);
        expect(mergedSlice.elements).toEqual(expectedElements);
    });

    it('should handle slices with only properties or only elements', () => {
        const slice1: SettingSlice = {
            properties: { prop1: { type: 'string' } },
            elements: [],
        };
        const slice2: SettingSlice = {
            properties: {},
            elements: [{ type: 'Control', scope: '#/properties/prop1' } as UIElement],
        };
        const slice3: SettingSlice = {
            properties: { prop2: { type: 'number' } },
            elements: [{ type: 'Label', text: 'Label' } as UIElement],
        };

        const expectedProperties: DataSlice = {
            prop1: { type: 'string' },
            prop2: { type: 'number' },
        };
        const expectedElements: UIElement[] = [
            { type: 'Control', scope: '#/properties/prop1' },
            { type: 'Label', text: 'Label' },
        ];

        const mergedSlice = mergeSettingSlices([slice1, slice2, slice3]);

        expect(mergedSlice.properties).toEqual(expectedProperties);
        expect(mergedSlice.elements).toEqual(expectedElements);
    });
});
