/**
 * Component Mock Utilities
 *
 * This file provides utilities for testing Vue components that use the composition API
 * without having to deal with the complexity of mocking computed properties, refs, etc.
 *
 * The approach creates simplified Vue option API components that mimic the behavior
 * of the original components, making them easier to test.
 */

import { mount } from '@vue/test-utils';

import type { ComponentMountingOptions } from '@vue/test-utils';

/**
 * Creates a mock component that simulates the behavior of a component with composition API
 *
 * @param template The Vue template string for the mock component
 * @param logicFn Function that transforms the input options into component data
 */
export function createMockComponent<Props extends Record<string, any>, Data extends Record<string, any>>(
  template: string,
  logicFn: (props: Props) => Data
) {
  return (props: Props) => {
    const componentData = logicFn(props);

    const mockComponent = {
      template,
      data() {
        return componentData;
      },
    };

    return mount(mockComponent);
  };
}

/**
 * Creates a mock component factory specialized for list-rendering components with filtering
 *
 * @param itemType Type of items being rendered in the list
 * @param templateFn Function that generates the template based on the passed options
 * @returns A factory function that creates test components
 */
export function createListComponentMockFactory<
  ItemType,
  FilterOptions extends {
    items?: ItemType[];
    storeItems?: ItemType[];
    filterBy?: string[];
    filterOut?: string[];
  },
>(
  templateFn: (options: {
    filteredItems: ItemType[] | undefined;
    maxWidth?: boolean;
    t: (key: string) => string;
  }) => string,
  getItemKey: (item: ItemType) => string
) {
  return (options: FilterOptions & { maxWidth?: boolean; t?: (key: string) => string }) => {
    const { items, storeItems, filterBy, filterOut, maxWidth } = options;

    // Default translator function
    const t = options.t || ((key: string) => `translated_${key}`);

    // Function that emulates the component's filtering logic
    function getFilteredItems() {
      // Emulate computedActions logic
      const allItems = items || storeItems;

      if (!allItems || (!filterBy && !filterOut)) {
        return allItems;
      }

      // Emulate filtering logic
      return allItems.filter((item) => {
        const key = getItemKey(item);
        return filterOut ? !filterOut.includes(key) : filterBy?.includes(key);
      });
    }

    const mockComponent = {
      template: templateFn({
        filteredItems: getFilteredItems(),
        maxWidth,
        t,
      }),
      data() {
        return {
          filteredItems: getFilteredItems(),
          maxWidth: maxWidth || false,
          t,
        };
      },
    };

    return mount(mockComponent);
  };
}
