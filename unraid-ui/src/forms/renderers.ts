import comboBoxRenderer from '@/forms/ComboBoxField.vue';
import ControlWrapper from '@/forms/ControlWrapper.vue';
import HorizontalLayout from '@/forms/HorizontalLayout.vue';
import inputFieldRenderer from '@/forms/InputField.vue';
import LabelRenderer from '@/forms/LabelRenderer.vue';
import MissingRenderer from '@/forms/MissingRenderer.vue';
import numberFieldRenderer from '@/forms/NumberField.vue';
import PreconditionsLabel from '@/forms/PreconditionsLabel.vue';
import selectRenderer from '@/forms/Select.vue';
import SteppedLayout from '@/forms/SteppedLayout.vue';
import StringArrayField from '@/forms/StringArrayField.vue';
import switchRenderer from '@/forms/Switch.vue';
import UnraidSettingsLayout from '@/forms/UnraidSettingsLayout.vue';
import VerticalLayout from '@/forms/VerticalLayout.vue';
import {
  and,
  isBooleanControl,
  isControl,
  isEnumControl,
  isIntegerControl,
  isLayout,
  isNumberControl,
  isStringControl,
  optionIs,
  or,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core';
import type { ControlElement, JsonFormsRendererRegistryEntry, JsonSchema } from '@jsonforms/core';
import type { RendererProps } from '@jsonforms/vue';
import { h, markRaw, type Component } from 'vue';

// Helper function to wrap control renderers with error display
// Returns a functional component
const withErrorWrapper = (RendererComponent: Component) => {
  return (props: RendererProps<ControlElement>) => {
    return h(ControlWrapper, props, {
      default: () => h(RendererComponent, props),
    });
  };
};

const isStringArray = (schema: JsonSchema): boolean => {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return false;
  const items = schema.items as JsonSchema;
  return schema.type === 'array' && items?.type === 'string';
};

export const jsonFormsRenderers: JsonFormsRendererRegistryEntry[] = [
  // Layouts
  {
    renderer: markRaw(VerticalLayout),
    tester: rankWith(2, and(isLayout, uiTypeIs('VerticalLayout'))),
  },
  {
    renderer: markRaw(HorizontalLayout),
    tester: rankWith(3, and(isLayout, uiTypeIs('HorizontalLayout'))),
  },
  {
    renderer: markRaw(SteppedLayout),
    tester: rankWith(3, and(isLayout, uiTypeIs('SteppedLayout'))),
  },
  {
    renderer: markRaw(UnraidSettingsLayout),
    tester: rankWith(3, and(isLayout, uiTypeIs('UnraidSettingsLayout'))),
  },
  // Controls
  {
    renderer: markRaw(withErrorWrapper(switchRenderer)),
    tester: rankWith(4, and(isBooleanControl, optionIs('toggle', true))),
  },
  {
    renderer: markRaw(withErrorWrapper(switchRenderer)),
    tester: rankWith(4, and(isBooleanControl, optionIs('format', 'toggle'))),
  },
  {
    renderer: markRaw(withErrorWrapper(switchRenderer)),
    tester: rankWith(4, and(isBooleanControl, optionIs('format', 'checkbox'))),
  },
  {
    renderer: markRaw(withErrorWrapper(selectRenderer)),
    tester: rankWith(4, and(isEnumControl)),
  },
  {
    renderer: markRaw(withErrorWrapper(comboBoxRenderer)),
    tester: rankWith(4, and(isControl, optionIs('format', 'combobox'))),
  },
  {
    renderer: markRaw(withErrorWrapper(numberFieldRenderer)),
    tester: rankWith(4, or(isNumberControl, isIntegerControl)),
  },
  {
    renderer: markRaw(withErrorWrapper(inputFieldRenderer)),
    tester: rankWith(3, isStringControl),
  },
  {
    renderer: markRaw(withErrorWrapper(StringArrayField)),
    tester: rankWith(4, and(isControl, schemaMatches(isStringArray), optionIs('format', 'array'))),
  },
  // Labels
  {
    renderer: markRaw(PreconditionsLabel),
    tester: rankWith(3, and(uiTypeIs('Label'), optionIs('format', 'preconditions'))),
  },
  {
    renderer: markRaw(LabelRenderer),
    tester: rankWith(3, and(uiTypeIs('Label'))),
  },
  // Fallback / Meta
  {
    renderer: markRaw(withErrorWrapper(MissingRenderer)),
    tester: rankWith(0, isControl),
  },
];
