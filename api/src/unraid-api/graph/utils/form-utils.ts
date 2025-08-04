import type { ControlElement, LabelElement, Layout, Rule } from '@jsonforms/core';

/**
 * Creates a simple VerticalLayout containing a Label followed by a Control element.
 * Useful for detail views within array fields where UnraidSettingsLayout doesn't work well.
 */
export function createSimpleLabeledControl({
    scope,
    label,
    description,
    controlOptions,
}: {
    scope: string;
    label: string;
    description?: string;
    controlOptions?: ControlElement['options'];
}): Layout {
    return {
        type: 'VerticalLayout',
        elements: [
            {
                type: 'Label',
                text: label,
                options: {
                    description,
                },
            } as LabelElement,
            {
                type: 'Control',
                scope: scope,
                options: controlOptions,
            } as ControlElement,
        ],
    };
}

/**
 * Creates a Layout (typically UnraidSettingsLayout) containing a Label and a Control element.
 */
export function createLabeledControl({
    scope,
    label,
    description,
    controlOptions,
    labelOptions,
    layoutOptions,
    rule,
}: {
    scope: string;
    label: string;
    description?: string;
    controlOptions: ControlElement['options'];
    labelOptions?: LabelElement['options'];
    layoutOptions?: Layout['options'];
    rule?: Rule;
}): Layout {
    const layout: Layout & { scope?: string } = {
        type: 'UnraidSettingsLayout', // Use the specific Unraid layout type
        scope: scope, // Apply scope to the layout for potential rules/visibility
        options: layoutOptions,
        elements: [
            {
                type: 'Label',
                text: label,
                scope: scope, // Scope might be needed for specific label behaviors
                options: { ...labelOptions, description },
            } as LabelElement,
            {
                type: 'Control',
                scope: scope,
                options: controlOptions,
            } as ControlElement,
        ],
    };
    // Conditionally add the rule to the layout if provided
    if (rule) {
        layout.rule = rule;
    }
    return layout;
}
