import { flushPromises, mount } from '@vue/test-utils';

import { INSTALLED_UNRAID_PLUGINS_QUERY } from '@/components/Onboarding/graphql/installedPlugins.query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OnboardingPluginsStep from '~/components/Onboarding/steps/OnboardingPluginsStep.vue';
import { createTestI18n } from '../../utils/i18n';

const { draftStore, installedPluginsLoading, installedPluginsResult, useQueryMock } = vi.hoisted(() => ({
  draftStore: {
    selectedPlugins: new Set<string>(),
    pluginSelectionInitialized: false,
    setPlugins: vi.fn(),
  },
  installedPluginsLoading: {
    value: false,
  },
  installedPluginsResult: {
    value: {
      installedUnraidPlugins: [],
    } as { installedUnraidPlugins: string[] } | null,
  },
  useQueryMock: vi.fn(),
}));

vi.mock('@unraid/ui', () => ({
  BrandButton: {
    props: ['text', 'variant', 'disabled', 'loading'],
    emits: ['click'],
    template:
      '<button data-testid="brand-button" :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
  },
  Spinner: {
    name: 'Spinner',
    template: '<div data-testid="loading-spinner" />',
  },
}));

vi.mock('@headlessui/vue', () => ({
  Switch: {
    props: ['modelValue', 'disabled'],
    emits: ['update:modelValue'],
    template: `
      <input
        data-testid="plugin-switch"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
    `,
  },
}));

vi.mock('@/components/Onboarding/store/onboardingDraft', () => ({
  useOnboardingDraftStore: () => draftStore,
}));

vi.mock('@vue/apollo-composable', async () => {
  const actual =
    await vi.importActual<typeof import('@vue/apollo-composable')>('@vue/apollo-composable');
  return {
    ...actual,
    useQuery: useQueryMock,
  };
});

describe('OnboardingPluginsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    draftStore.selectedPlugins = new Set();
    draftStore.pluginSelectionInitialized = false;
    installedPluginsLoading.value = false;
    installedPluginsResult.value = {
      installedUnraidPlugins: [],
    };

    useQueryMock.mockImplementation((query: unknown) => {
      if (query === INSTALLED_UNRAID_PLUGINS_QUERY) {
        return {
          result: installedPluginsResult,
          loading: installedPluginsLoading,
        };
      }
      return { result: { value: null } };
    });
  });

  const mountComponent = (overrides: Record<string, unknown> = {}) => {
    const props = {
      onComplete: vi.fn(),
      onBack: vi.fn(),
      onSkip: vi.fn(),
      showBack: true,
      showSkip: true,
      ...overrides,
    };

    return {
      wrapper: mount(OnboardingPluginsStep, {
        props,
        global: {
          plugins: [createTestI18n()],
        },
      }),
      props,
    };
  };

  it('defaults Community Apps only on first visit and persists selection on next', async () => {
    const { wrapper, props } = mountComponent();

    await flushPromises();

    const switches = wrapper.findAll('input[type="checkbox"]');
    expect(switches.length).toBe(3);
    expect((switches[0].element as HTMLInputElement).checked).toBe(true);
    expect((switches[1].element as HTMLInputElement).checked).toBe(false);
    expect((switches[2].element as HTMLInputElement).checked).toBe(false);
    for (const pluginSwitch of switches) {
      expect((pluginSwitch.element as HTMLInputElement).disabled).toBe(false);
    }

    const nextButton = wrapper
      .findAll('button')
      .find((button) => button.text().toLowerCase().includes('next'));

    expect(nextButton).toBeTruthy();
    await nextButton!.trigger('click');

    expect(draftStore.setPlugins).toHaveBeenCalled();
    const lastCallIndex = draftStore.setPlugins.mock.calls.length - 1;
    const selected = draftStore.setPlugins.mock.calls[lastCallIndex][0] as Set<string>;
    expect(Array.from(selected)).toEqual(['community-apps']);
    expect(props.onComplete).toHaveBeenCalledTimes(1);
  });

  it('persists already installed plugins alongside manual selections', async () => {
    installedPluginsResult.value = {
      installedUnraidPlugins: ['fix.common.problems.plg', 'tailscale.plg'],
    };

    const { wrapper, props } = mountComponent();

    await flushPromises();

    const switches = wrapper.findAll('input[type="checkbox"]');
    expect(switches.length).toBe(3);
    expect((switches[0].element as HTMLInputElement).checked).toBe(true);
    expect((switches[1].element as HTMLInputElement).checked).toBe(true);
    expect((switches[2].element as HTMLInputElement).checked).toBe(true);

    const nextButton = wrapper
      .findAll('button')
      .find((button) => button.text().toLowerCase().includes('next'));

    expect(nextButton).toBeTruthy();
    await nextButton!.trigger('click');

    expect(draftStore.setPlugins).toHaveBeenCalled();
    const lastCallIndex = draftStore.setPlugins.mock.calls.length - 1;
    const selected = draftStore.setPlugins.mock.calls[lastCallIndex][0] as Set<string>;
    expect(Array.from(selected).sort()).toEqual(['community-apps', 'fix-common-problems', 'tailscale']);
    expect(props.onComplete).toHaveBeenCalledTimes(1);
  });

  it('disables the primary action until installed plugins finish loading', async () => {
    installedPluginsLoading.value = true;
    installedPluginsResult.value = null;

    const { wrapper } = mountComponent();

    await flushPromises();

    const nextButton = wrapper
      .findAll('button')
      .find((button) => button.text().toLowerCase().includes('next'));

    expect(nextButton).toBeTruthy();
    expect((nextButton!.element as HTMLButtonElement).disabled).toBe(true);
  });

  it('skip clears selection and calls onSkip', async () => {
    draftStore.pluginSelectionInitialized = true;
    draftStore.selectedPlugins = new Set(['community-apps']);

    const { wrapper, props } = mountComponent();

    await flushPromises();

    const skipButton = wrapper
      .findAll('button')
      .find((button) => button.text().toLowerCase().includes('skip'));

    expect(skipButton).toBeTruthy();
    await skipButton!.trigger('click');

    expect(draftStore.setPlugins).toHaveBeenCalledTimes(1);
    const selected = draftStore.setPlugins.mock.calls[0][0] as Set<string>;
    expect(selected.size).toBe(0);
    expect(props.onSkip).toHaveBeenCalledTimes(1);
    expect(props.onComplete).not.toHaveBeenCalled();
  });

  it('skip preserves detected installed plugins without keeping manual selections', async () => {
    draftStore.pluginSelectionInitialized = true;
    draftStore.selectedPlugins = new Set(['community-apps', 'tailscale']);
    installedPluginsResult.value = {
      installedUnraidPlugins: ['fix.common.problems.plg'],
    };

    const { wrapper, props } = mountComponent();

    await flushPromises();

    const skipButton = wrapper
      .findAll('button')
      .find((button) => button.text().toLowerCase().includes('skip'));

    expect(skipButton).toBeTruthy();
    await skipButton!.trigger('click');

    expect(draftStore.setPlugins).toHaveBeenCalledTimes(1);
    const selected = draftStore.setPlugins.mock.calls[0][0] as Set<string>;
    expect(Array.from(selected)).toEqual(['fix-common-problems']);
    expect(props.onSkip).toHaveBeenCalledTimes(1);
    expect(props.onComplete).not.toHaveBeenCalled();
  });
});
