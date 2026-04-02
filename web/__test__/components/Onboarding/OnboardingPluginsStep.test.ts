import { flushPromises, mount } from '@vue/test-utils';

import { INSTALLED_UNRAID_PLUGINS_QUERY } from '@/components/Onboarding/graphql/installedPlugins.query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OnboardingPluginsStep from '~/components/Onboarding/steps/OnboardingPluginsStep.vue';
import { createTestI18n } from '../../utils/i18n';

const { draftStore, installedPluginsLoading, installedPluginsResult, useQueryMock } = vi.hoisted(() => ({
  draftStore: {
    selectedPlugins: new Set<string>(),
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
    document.body.innerHTML = '';
    draftStore.selectedPlugins = new Set();
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
      initialDraft:
        draftStore.selectedPlugins.size > 0
          ? {
              selectedIds: Array.from(draftStore.selectedPlugins),
            }
          : undefined,
      showBack: true,
      showSkip: true,
      ...overrides,
    };

    return {
      wrapper: mount(OnboardingPluginsStep, {
        props,
        global: {
          plugins: [createTestI18n()],
          stubs: {
            USwitch: {
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
            UAlert: {
              props: ['description'],
              template: '<div data-testid="alert">{{ description }}</div>',
            },
          },
        },
      }),
      props,
    };
  };

  it('defaults Community Apps only on first visit and persists selection on next', async () => {
    const { wrapper, props } = mountComponent();

    await flushPromises();

    const switches = wrapper.findAll('[role="switch"]');
    expect(switches.length).toBe(3);
    expect(switches[0].attributes('data-state')).toBe('checked');
    expect(switches[1].attributes('data-state')).toBe('unchecked');
    expect(switches[2].attributes('data-state')).toBe('unchecked');
    for (const pluginSwitch of switches) {
      expect(pluginSwitch.attributes('disabled')).toBeUndefined();
    }

    const nextButton = wrapper
      .findAll('button')
      .find((button) => button.text().toLowerCase().includes('next'));

    expect(nextButton).toBeTruthy();
    await nextButton!.trigger('click');

    expect(props.onComplete).toHaveBeenCalledTimes(1);
    expect(props.onComplete).toHaveBeenCalledWith({
      selectedIds: ['community-apps'],
    });
  });

  it('persists already installed plugins alongside manual selections', async () => {
    installedPluginsResult.value = {
      installedUnraidPlugins: ['fix.common.problems.plg', 'tailscale.plg'],
    };

    const { wrapper, props } = mountComponent();

    await flushPromises();

    const switches = wrapper.findAll('[role="switch"]');
    expect(switches.length).toBe(3);
    expect(switches[0].attributes('data-state')).toBe('checked');
    expect(switches[1].attributes('data-state')).toBe('checked');
    expect(switches[2].attributes('data-state')).toBe('checked');

    const nextButton = wrapper
      .findAll('button')
      .find((button) => button.text().toLowerCase().includes('next'));

    expect(nextButton).toBeTruthy();
    await nextButton!.trigger('click');

    expect(props.onComplete).toHaveBeenCalledTimes(1);
    expect(props.onComplete).toHaveBeenCalledWith({
      selectedIds: ['community-apps', 'fix-common-problems', 'tailscale'],
    });
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
    draftStore.selectedPlugins = new Set(['community-apps']);

    const { wrapper, props } = mountComponent();

    await flushPromises();

    const skipButton = wrapper
      .findAll('button')
      .find((button) => button.text().toLowerCase().includes('skip'));

    expect(skipButton).toBeTruthy();
    await skipButton!.trigger('click');

    expect(props.onSkip).toHaveBeenCalledTimes(1);
    expect(props.onSkip).toHaveBeenCalledWith({
      selectedIds: [],
    });
    expect(props.onComplete).not.toHaveBeenCalled();
  });

  it('skip preserves detected installed plugins without keeping manual selections', async () => {
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

    expect(props.onSkip).toHaveBeenCalledTimes(1);
    expect(props.onSkip).toHaveBeenCalledWith({
      selectedIds: ['fix-common-problems'],
    });
    expect(props.onComplete).not.toHaveBeenCalled();
  });

  it('preserves an explicit empty plugin selection instead of restoring defaults', async () => {
    const { wrapper } = mountComponent({
      initialDraft: {
        selectedIds: [],
      },
    });

    await flushPromises();

    const switches = wrapper.findAll('[role="switch"]');
    expect(switches.length).toBe(3);
    expect(switches[0].attributes('data-state')).toBe('unchecked');
    expect(switches[1].attributes('data-state')).toBe('unchecked');
    expect(switches[2].attributes('data-state')).toBe('unchecked');
  });
});
