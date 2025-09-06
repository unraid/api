/**
 * DevSettings Component Test Coverage
 */

import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import { CogIcon } from '@heroicons/vue/24/solid';
import { Button, PopoverContent, PopoverTrigger } from '@unraid/ui';
import { describe, expect, it, vi } from 'vitest';

import DevSettings from '~/components/DevSettings.vue';

vi.mock('@unraid/ui', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
  };
});

describe('DevSettings', () => {
  it('renders the trigger button and hides content initially', () => {
    const wrapper = mount(DevSettings, {
      global: {
        stubs: { DummyServerSwitcher: true },
      },
    });

    const triggerButton = wrapper.findComponent(PopoverTrigger).findComponent(Button);
    expect(triggerButton.exists()).toBe(true);
    expect(triggerButton.findComponent(CogIcon).exists()).toBe(true);

    expect(wrapper.findComponent(PopoverContent).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'DummyServerSwitcher' }).exists()).toBe(false);
  });

  it('does not error when trigger button is clicked', async () => {
    const wrapper = mount(DevSettings, {
      global: {
        stubs: { DummyServerSwitcher: true, PopoverContent: true },
      },
    });
    const triggerButton = wrapper.findComponent(PopoverTrigger).findComponent(Button);

    await triggerButton.trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();

    // No assertion needed here, the test passes if no error is thrown during the click simulation.
  });
});
