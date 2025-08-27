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
    rule,
}: {
    scope: string;
    label: string;
    description?: string;
    controlOptions?: ControlElement['options'];
    rule?: Rule;
}): Layout {
    const layout: Layout = {
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

    // Add rule if provided
    if (rule) {
        layout.rule = rule;
    }

    return layout;
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
    layoutType = 'UnraidSettingsLayout',
    rule,
    passScopeToLayout = false,
}: {
    scope: string;
    label: string;
    description?: string;
    controlOptions?: ControlElement['options'];
    labelOptions?: LabelElement['options'];
    layoutOptions?: Layout['options'];
    layoutType?: 'UnraidSettingsLayout' | 'VerticalLayout' | 'HorizontalLayout';
    rule?: Rule;
    passScopeToLayout?: boolean;
}): Layout {
    const elements: Array<LabelElement | ControlElement> = [
        {
            type: 'Label',
            text: label,
            options: { ...labelOptions, description },
        } as LabelElement,
        {
            type: 'Control',
            scope: scope,
            options: controlOptions,
        } as ControlElement,
    ];

    const layout: Layout = {
        type: layoutType,
        options: layoutOptions,
        elements,
    } as Layout;

    // Optionally add scope to the layout itself (for backward compatibility)
    if (passScopeToLayout) {
        (layout as any).scope = scope;
    }

    // Conditionally add the rule to the layout if provided
    if (rule) {
        layout.rule = rule;
    }
    return layout;
}

/**
 * Creates an AccordionLayout that wraps child elements in an accordion interface.
 * Each element becomes an accordion item with configurable titles and descriptions.
 */
export function createAccordionLayout({
    elements,
    defaultOpen,
    rule,
}: {
    elements: Array<
        Layout & {
            options?: Layout['options'] & {
                accordion?: {
                    title?: string;
                    description?: string;
                };
            };
        }
    >;
    defaultOpen?: number | number[] | 'all';
    rule?: Rule;
}): Layout {
    const layout: Layout = {
        type: 'AccordionLayout',
        options: {
            accordion: {
                defaultOpen,
            },
        },
        elements,
    };

    if (rule) {
        layout.rule = rule;
    }

    return layout;
}
