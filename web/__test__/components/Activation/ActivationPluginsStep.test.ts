import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ActivationPluginsStep from '~/components/Activation/ActivationPluginsStep.vue';
import { PluginInstallStatus } from '~/composables/gql/graphql';
import { createTestI18n } from '../../utils/i18n';

const installPluginMock = vi.fn();

vi.mock('@unraid/ui', () => ({
  BrandButton: {
    props: ['text', 'variant', 'disabled', 'loading'],
    template:
      '<button data-testid="brand-button" :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
  },
}));

vi.mock('~/components/Activation/usePluginInstaller', () => ({
  default: () => ({
    installPlugin: installPluginMock,
  }),
}));

describe('ActivationPluginsStep', () => {
  beforeEach(() => {
    installPluginMock.mockReset();
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
      wrapper: mount(ActivationPluginsStep, {
        props,
        global: {
          plugins: [createTestI18n()],
        },
      }),
      props,
    };
  };

  it('installs selected plugins, streams output, and completes', async () => {
    installPluginMock.mockImplementation(async ({ onEvent }) => {
      onEvent?.({
        operationId: 'op-123',
        status: PluginInstallStatus.RUNNING,
        output: ['installation started'],
        timestamp: new Date().toISOString(),
      });
      return {
        operationId: 'op-123',
        status: PluginInstallStatus.SUCCEEDED,
        output: ['installation complete'],
      };
    });

    const { wrapper, props } = mountComponent();

    const installButton = wrapper
      .findAll('[data-testid="brand-button"]')
      .find((button) => button.text().includes('Install'));
    expect(installButton).toBeTruthy();
    await installButton!.trigger('click');
    await flushPromises();

    expect(installPluginMock).toHaveBeenCalled();
    const firstCallArgs = installPluginMock.mock.calls[0]?.[0];
    expect(firstCallArgs?.forced).toBe(true);
    expect(firstCallArgs?.url).toContain('community.applications');
    expect(props.onComplete).toHaveBeenCalled();
    expect(wrapper.html()).toContain('installation started');
    expect(wrapper.html()).toContain('installed successfully');
  });

  it('shows error message when installation fails', async () => {
    installPluginMock.mockRejectedValueOnce(new Error('install failed'));

    const { wrapper, props } = mountComponent();
    const installButton = wrapper
      .findAll('[data-testid="brand-button"]')
      .find((button) => button.text().includes('Install'));
    await installButton!.trigger('click');
    await flushPromises();

    expect(props.onComplete).not.toHaveBeenCalled();
    expect(wrapper.html()).toContain('Failed to install plugins. Please try again.');
  });
});
