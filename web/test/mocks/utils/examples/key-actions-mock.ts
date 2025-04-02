/**
 * Example: Using the component-mock utility to test KeyActions component
 *
 * This file shows how to use the createListComponentMockFactory to create
 * a reusable test factory for testing the KeyActions component.
 */

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';

import type { ServerStateDataAction } from '~/types/server';

import { createListComponentMockFactory } from '../component-mock';

/**
 * Create a factory function for testing KeyActions component
 */
export const createKeyActionsTest = createListComponentMockFactory<
  ServerStateDataAction,
  {
    actions?: ServerStateDataAction[];
    storeActions?: ServerStateDataAction[];
    filterBy?: string[];
    filterOut?: string[];
  }
>(
  // Template function that generates the mock component template
  ({ filteredItems, maxWidth, t }) => `
    <ul v-if="filteredItems" class="flex flex-col gap-y-8px">
      <li v-for="action in filteredItems" :key="action.name">
        <button
          :class="maxWidth ? 'w-full sm:max-w-300px' : 'w-full'"
          :disabled="action?.disabled"
          :data-external="action?.external"
          :href="action?.href"
          :title="action.title ? t(action.title) : undefined"
          @click="action.click?.()"
        >
          {{ t(action.text) }}
        </button>
      </li>
    </ul>
  `,
  // Function to get the key from each action item for filtering
  (action) => action.name
);

/**
 * Example usage of the KeyActions test factory
 */
export function exampleKeyActionsTest() {
  // Create sample actions for testing
  const sampleActions: ServerStateDataAction[] = [
    {
      name: 'activate',
      text: 'Action 1',
      title: 'Action 1 Title',
      href: '/action1',
      external: true,
      icon: ArrowTopRightOnSquareIcon,
      click: () => {},
    },
    {
      name: 'purchase',
      text: 'Action 2',
      title: 'Action 2 Title',
      href: '/action2',
      external: false,
      disabled: true,
      click: () => {},
    },
  ];

  // Example test cases

  // Test with actions from store
  const wrapper1 = createKeyActionsTest({
    storeActions: sampleActions,
  });

  // Test with custom actions
  const wrapper2 = createKeyActionsTest({
    actions: [sampleActions[0]],
  });

  // Test with filtering
  const wrapper3 = createKeyActionsTest({
    storeActions: sampleActions,
    filterBy: ['activate'],
  });

  // Test with maxWidth option
  const wrapper4 = createKeyActionsTest({
    storeActions: sampleActions,
    maxWidth: true,
  });

  return {
    wrapper1,
    wrapper2,
    wrapper3,
    wrapper4,
  };
}
