import type {
    Categorization,
    ComposableCondition,
    ControlElement,
    JsonSchema,
    JsonSchema7,
    LabelElement,
    Layout,
    LeafCondition,
    SchemaBasedCondition,
    UISchemaElement,
} from '@jsonforms/core';
import { merge } from 'lodash-es';

/**
 * JSON schema properties.
 */
export type DataSlice = Record<string, JsonSchema>;

/**
 * A JSONForms UI schema element.
 */
export type UIElement = (UISchemaElement | LabelElement | Layout | ControlElement | Categorization) & {
    elements?: UIElement[];
};

/**
 * A condition for a JSONForms rule.
 */
export type RuleCondition =
    | LeafCondition
    | ComposableCondition
    | SchemaBasedCondition
    | Omit<SchemaBasedCondition, 'scope'>;

/**
 * A slice of settings form data.
 */
export type SettingSlice = {
    /** One or more JSON schema properties.
     * Conceptually, this is a subset (slice) of the JSON schema,
     * specific to a piece or logical group of data.
     */
    properties: DataSlice;
    /** One or more UI schema elements that describe the form layout of this piece/subset of data. */
    elements: UIElement[];
};

export function createEmptySettingSlice(): SettingSlice {
    return { properties: {}, elements: [] };
}

/**
 * Reduces multiple setting slices into a single slice
 */
function reduceSlices(slices: SettingSlice[]): SettingSlice {
    const result = createEmptySettingSlice();
    for (const slice of slices) {
        // Deep merge properties using lodash.merge
        merge(result.properties, slice.properties);
        // Append elements
        result.elements.push(...slice.elements);
    }
    return result;
}

/**
 * Merges multiple setting slices into a single, holistic slice.
 */
export const mergeSettingSlices = (slices: SettingSlice[], options?: { as?: string }): SettingSlice => {
    const merged = reduceSlices(slices);
    if (options?.as) {
        return {
            properties: {
                [options.as]: merged.properties,
            },
            elements: merged.elements,
        };
    }
    return merged;
};
