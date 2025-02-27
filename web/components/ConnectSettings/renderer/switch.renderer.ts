import { and, isBooleanControl, optionIs, rankWith } from '@jsonforms/core';

import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';

import controlRenderer from './FormSwitch.vue';

export const formSwitchEntry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(4, and(isBooleanControl, optionIs('toggle', true))),
};
