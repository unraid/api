/**
 * ColorSwitcher Component Test Coverage
 */

import { nextTick } from 'vue';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';

import { Input, Label, Select, SelectTrigger, Switch } from '@unraid/ui';
import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MockInstance } from 'vitest';

import ColorSwitcher from '~/components/ColorSwitcher.ce.vue';
import { useThemeStore } from '~/store/theme';

// Explicitly mock @unraid/ui to ensure we use the actual components
vi.mock('@unraid/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@unraid/ui')>();
  return {
    ...actual,
  };
});

vi.mock('~/themes/default', () => ({
  defaultColors: {
    white: {
      '--header-text-primary': '#ffffff',
      '--header-text-secondary': '#eeeeee',
      '--header-background-color': '#111111',
    },
    black: {
      '--header-text-primary': '#000000',
      '--header-text-secondary': '#222222',
      '--header-background-color': '#cccccc',
    },
  },
}));

describe('ColorSwitcher', () => {
  let themeStore: ReturnType<typeof useThemeStore>;
  let modalDiv: HTMLDivElement;
  let consoleWarnSpy: MockInstance;

  beforeEach(() => {
    vi.useFakeTimers();
    const pinia = createTestingPinia({ createSpy: vi.fn });
    setActivePinia(pinia);
    themeStore = useThemeStore();

    modalDiv = document.createElement('div');
    modalDiv.id = 'modals';
    document.body.appendChild(modalDiv);

    vi.clearAllMocks();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    document.body.removeChild(modalDiv);
    consoleWarnSpy.mockRestore();
  });

  it('renders all form elements correctly', () => {
    const wrapper = mount(ColorSwitcher, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    });

    const labels = wrapper.findAllComponents(Label);
    expect(labels).toHaveLength(7);

    const inputs = wrapper.findAllComponents(Input);
    expect(inputs).toHaveLength(3);

    const switches = wrapper.findAllComponents(Switch);
    expect(switches).toHaveLength(3);

    expect(wrapper.findComponent(SelectTrigger).exists()).toBe(true);
  });

  it('updates theme store when theme selection changes', async () => {
    const wrapper = mount(ColorSwitcher, {
      global: {
        stubs: {
          Select: {
            template: '<div/>',
            props: ['modelValue'],
            emits: ['update:modelValue'],
          },
        },
      },
    });

    const selectComponent = wrapper.findComponent(Select);
    await selectComponent.vm.$emit('update:modelValue', 'black');
    await nextTick();

    expect(themeStore.setTheme).toHaveBeenCalledTimes(2);

    expect(themeStore.setTheme).toHaveBeenLastCalledWith({
      name: 'black',
      banner: true,
      bannerGradient: true,
      descriptionShow: true,
      textColor: '',
      metaColor: '',
      bgColor: '',
    });
  });

  it('updates theme store when color inputs change', async () => {
    const wrapper = mount(ColorSwitcher, {
      global: {},
    });

    const inputs = wrapper.findAllComponents(Input);
    const primaryTextInput = inputs[0];
    const secondaryTextInput = inputs[1];
    const bgInput = inputs[2];

    await primaryTextInput.setValue('#ff0000');
    await nextTick();

    expect(themeStore.setTheme).toHaveBeenCalledTimes(2);
    expect(themeStore.setTheme).toHaveBeenCalledWith(expect.objectContaining({ textColor: '#ff0000' }));

    await secondaryTextInput.setValue('#00ff00');
    await nextTick();

    expect(themeStore.setTheme).toHaveBeenCalledTimes(3);
    expect(themeStore.setTheme).toHaveBeenCalledWith(expect.objectContaining({ metaColor: '#00ff00' }));

    await bgInput.setValue('#0000ff');
    await nextTick();

    expect(themeStore.setTheme).toHaveBeenCalledTimes(4);
    expect(themeStore.setTheme).toHaveBeenCalledWith(expect.objectContaining({ bgColor: '#0000ff' }));

    expect(themeStore.setTheme).toHaveBeenLastCalledWith({
      name: 'white',
      banner: true,
      bannerGradient: true,
      descriptionShow: true,
      textColor: '#ff0000',
      metaColor: '#00ff00',
      bgColor: '#0000ff',
    });
  });

  it('updates theme store when switches change', async () => {
    const wrapper = mount(ColorSwitcher, {
      global: {},
    });

    themeStore = useThemeStore();

    vi.clearAllMocks();

    const switches = wrapper.findAllComponents(Switch);
    const gradientSwitch = switches[0];
    const descriptionSwitch = switches[1];
    const bannerSwitch = switches[2];

    await descriptionSwitch.vm.$emit('update:checked', false);
    await nextTick();

    expect(themeStore.setTheme).toHaveBeenLastCalledWith(
      expect.objectContaining({ descriptionShow: false })
    );

    await bannerSwitch.vm.$emit('update:checked', false);
    await nextTick();

    expect(themeStore.setTheme).toHaveBeenLastCalledWith(
      expect.objectContaining({ banner: false, bannerGradient: true })
    );

    await gradientSwitch.vm.$emit('update:checked', false);
    await nextTick();

    expect(themeStore.setTheme).toHaveBeenLastCalledWith(
      expect.objectContaining({ bannerGradient: false })
    );
  });

  it('enables gradient automatically when banner is enabled', async () => {
    const wrapper = mount(ColorSwitcher, {
      global: {},
    });

    themeStore = useThemeStore();

    const switches = wrapper.findAllComponents(Switch);
    const gradientSwitch = switches[0];
    const bannerSwitch = switches[2];

    await bannerSwitch.vm.$emit('update:checked', false);
    await nextTick();
    await gradientSwitch.vm.$emit('update:checked', false);
    await nextTick();

    vi.clearAllMocks();

    await bannerSwitch.vm.$emit('update:checked', true);
    await nextTick();

    expect(themeStore.setTheme).toHaveBeenLastCalledWith(
      expect.objectContaining({ banner: true, bannerGradient: true })
    );
  });
});
