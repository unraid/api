import type { ControlElement } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';

import type { SettingSlice } from '@app/unraid-api/types/json-forms.js';
import { createEmptySettingSlice, mergeSettingSlices } from '@app/unraid-api/types/json-forms.js';

describe('mergeSettingSlices', () => {
    it('returns an empty slice when given an empty array', () => {
        const result = mergeSettingSlices([]);
        expect(result).toEqual(createEmptySettingSlice());
    });

    it('returns the same slice when given a single slice', () => {
        const slice: SettingSlice = {
            properties: {
                test: { type: 'string' },
            },
            elements: [{ type: 'Control', scope: '#/properties/test' }],
        };

        const result = mergeSettingSlices([slice]);
        expect(result).toEqual(slice);
    });

    it('merges properties and concatenates elements from multiple slices', () => {
        const slice1: SettingSlice = {
            properties: {
                prop1: { type: 'string' },
            },
            elements: [{ type: 'Control', scope: '#/properties/prop1' }],
        };

        const slice2: SettingSlice = {
            properties: {
                prop2: { type: 'number' },
            },
            elements: [{ type: 'Control', scope: '#/properties/prop2' }],
        };

        const expected: SettingSlice = {
            properties: {
                prop1: { type: 'string' },
                prop2: { type: 'number' },
            },
            elements: [
                { type: 'Control', scope: '#/properties/prop1' },
                { type: 'Control', scope: '#/properties/prop2' },
            ],
        };

        const result = mergeSettingSlices([slice1, slice2]);
        expect(result).toEqual(expected);
    });

    it('handles more complex schema properties and UI elements', () => {
        const slice1: SettingSlice = {
            properties: {
                name: {
                    type: 'string',
                    title: 'Name',
                    minLength: 3,
                },
            },
            elements: [
                {
                    type: 'Control',
                    scope: '#/properties/name',
                    label: 'Full Name',
                } as ControlElement,
            ],
        };

        const slice2: SettingSlice = {
            properties: {
                age: {
                    type: 'number',
                    title: 'Age',
                    minimum: 0,
                    maximum: 120,
                },
            },
            elements: [
                {
                    type: 'Control',
                    scope: '#/properties/age',
                    label: 'Your Age',
                } as ControlElement,
            ],
        };

        const slice3: SettingSlice = {
            properties: {
                active: {
                    type: 'boolean',
                    title: 'Active Status',
                    default: true,
                },
            },
            elements: [
                {
                    type: 'Control',
                    scope: '#/properties/active',
                    label: 'Is Active',
                    options: {
                        toggle: true,
                    },
                } as ControlElement,
            ],
        };

        const result = mergeSettingSlices([slice1, slice2, slice3]);

        // Check properties were merged correctly
        expect(result.properties).toHaveProperty('name');
        expect(result.properties).toHaveProperty('age');
        expect(result.properties).toHaveProperty('active');
        expect(result.properties.name.type).toBe('string');
        expect(result.properties.age.type).toBe('number');
        expect(result.properties.active.type).toBe('boolean');

        // Check elements were concatenated in order
        expect(result.elements).toHaveLength(3);
        expect(result.elements[0]).toEqual(slice1.elements[0]);
        expect(result.elements[1]).toEqual(slice2.elements[0]);
        expect(result.elements[2]).toEqual(slice3.elements[0]);
    });

    it('later properties override earlier ones with the same key', () => {
        const slice1: SettingSlice = {
            properties: {
                prop: { type: 'string', title: 'Original' },
            },
            elements: [
                { type: 'Control', scope: '#/properties/prop', label: 'First' } as ControlElement,
            ],
        };

        const slice2: SettingSlice = {
            properties: {
                prop: { type: 'number', title: 'Override' },
            },
            elements: [
                { type: 'Control', scope: '#/properties/prop', label: 'Second' } as ControlElement,
            ],
        };

        const result = mergeSettingSlices([slice1, slice2]);

        // The property from slice2 should override the one from slice1
        expect(result.properties.prop.type).toBe('number');
        expect(result.properties.prop.title).toBe('Override');

        // Both elements should be present
        expect(result.elements).toHaveLength(2);
        expect((result.elements[0] as ControlElement).label).toBe('First');
        expect((result.elements[1] as ControlElement).label).toBe('Second');
    });

    it('preserves empty properties and elements', () => {
        const slice1: SettingSlice = {
            properties: {},
            elements: [],
        };

        const slice2: SettingSlice = {
            properties: {
                prop: { type: 'string' },
            },
            elements: [{ type: 'Control', scope: '#/properties/prop' }],
        };

        const result = mergeSettingSlices([slice1, slice2]);
        expect(result.properties).toHaveProperty('prop');
        expect(result.elements).toHaveLength(1);

        const result2 = mergeSettingSlices([slice2, slice1]);
        expect(result2.properties).toHaveProperty('prop');
        expect(result2.elements).toHaveLength(1);
    });
});
