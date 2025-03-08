import {
  and,
  isBooleanControl,
  isEnumControl,
  isIntegerControl,
  isNumberControl,
  optionIs,
  or,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';

import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';

import selectRenderer from './FormSelect.vue';
import switchRenderer from './FormSwitch.vue';
import numberFieldRenderer from './NumberField.vue';
import PreconditionsLabel from './PreconditionsLabel.vue';

export const formSwitchEntry: JsonFormsRendererRegistryEntry = {
  renderer: switchRenderer,
  tester: rankWith(4, and(isBooleanControl, optionIs('toggle', true))),
};

export const formSelectEntry: JsonFormsRendererRegistryEntry = {
  renderer: selectRenderer,
  tester: rankWith(4, and(isEnumControl)),
};

export const numberFieldEntry: JsonFormsRendererRegistryEntry = {
  renderer: numberFieldRenderer,
  tester: rankWith(4, or(isNumberControl, isIntegerControl)),
};

export const preconditionsLabelEntry: JsonFormsRendererRegistryEntry = {
  renderer: PreconditionsLabel,
  tester: rankWith(3, and(uiTypeIs('Label'), optionIs('format', 'preconditions'))),
};
