import type {
    Categorization,
    ComposableCondition,
    ControlElement,
    JsonSchema,
    LabelElement,
    Layout,
    LeafCondition,
    SchemaBasedCondition,
    UISchemaElement,
} from '@jsonforms/core';

/**
 * JSON schema properties.
 */
export type DataSlice = Record<string, JsonSchema>;

/**
 * A JSONForms UI schema element.
 */
export type UIElement = UISchemaElement | LabelElement | Layout | ControlElement | Categorization;

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
        Object.assign(result.properties, slice.properties);
        result.elements.push(...slice.elements);
    }
    return result;
}

/**
 * Merges multiple setting slices into a single, holistic slice.
 */
export const mergeSettingSlices = reduceSlices;
