import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import OnboardingStepQueryGate from '~/components/Onboarding/components/OnboardingStepQueryGate.vue';
import { createTestI18n } from '../../utils/i18n';

vi.mock('@unraid/ui', () => ({
  BrandButton: {
    props: ['text'],
    emits: ['click'],
    template: '<button data-testid="brand-button" @click="$emit(\'click\')">{{ text }}</button>',
  },
  Spinner: {
    name: 'Spinner',
    template: '<div data-testid="loading-spinner" />',
  },
}));

describe('OnboardingStepQueryGate', () => {
  const mountComponent = (props: Record<string, unknown> = {}) =>
    mount(OnboardingStepQueryGate, {
      props,
      slots: {
        default: '<div data-testid="ready-content">ready</div>',
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

  it('renders the shared loading state while loading', () => {
    const wrapper = mountComponent({ loading: true });

    expect(wrapper.find('[data-testid="onboarding-loading-state"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="ready-content"]').exists()).toBe(false);
  });

  it('renders retry and close actions when an error is present', async () => {
    const onRetry = vi.fn();
    const onCloseOnboarding = vi.fn();
    const wrapper = mountComponent({
      error: new Error('offline'),
      onRetry,
      onCloseOnboarding,
    });

    expect(wrapper.find('[data-testid="onboarding-step-query-error"]').exists()).toBe(true);

    await wrapper.get('[data-testid="onboarding-step-query-retry"]').trigger('click');
    await wrapper.get('[data-testid="onboarding-step-query-close"]').trigger('click');

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onCloseOnboarding).toHaveBeenCalledTimes(1);
  });

  it('renders slot content once the query state is ready', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="ready-content"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="onboarding-loading-state"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="onboarding-step-query-error"]').exists()).toBe(false);
  });
});
