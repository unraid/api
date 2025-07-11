/**
 * ActivationSteps Component Test Coverage
 */

import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import ActivationSteps from '~/components/Activation/ActivationSteps.vue';

interface Props {
  activeStep?: number;
}

vi.mock('@unraid/ui', () => ({
  Stepper: {
    template: '<div data-testid="stepper" :default-value="defaultValue"><slot /></div>',
    props: ['defaultValue'],
  },
  StepperItem: {
    template: '<div data-testid="stepper-item"><slot :state="state" /></div>',
    props: ['step', 'disabled'],
    data() {
      return {
        state: 'active',
      };
    },
  },
  StepperTrigger: {
    template: '<div data-testid="stepper-trigger"><slot /></div>',
  },
  StepperTitle: {
    template: '<div data-testid="stepper-title"><slot /></div>',
  },
  StepperDescription: {
    template: '<div data-testid="stepper-description"><slot /></div>',
  },
  StepperSeparator: {
    template: '<div data-testid="stepper-separator"></div>',
  },
  Button: {
    template: '<button data-testid="button"><slot /></button>',
  },
}));

vi.mock('@heroicons/vue/24/outline', () => ({
  CheckIcon: { template: '<div data-testid="check-icon" />' },
  KeyIcon: { template: '<div data-testid="key-icon" />' },
  ServerStackIcon: { template: '<div data-testid="server-stack-icon" />' },
}));

vi.mock('@heroicons/vue/24/solid', () => ({
  KeyIcon: { template: '<div data-testid="key-icon-solid" />' },
  LockClosedIcon: { template: '<div data-testid="lock-closed-icon" />' },
  ServerStackIcon: { template: '<div data-testid="server-stack-icon-solid" />' },
}));

describe('ActivationSteps', () => {
  const mountComponent = (props: Props = {}) => {
    return mount(ActivationSteps, {
      props,
    });
  };

  it('renders all three steps with correct titles and descriptions', () => {
    const wrapper = mountComponent();
    const titles = wrapper.findAll('[data-testid="stepper-title"]');
    const descriptions = wrapper.findAll('[data-testid="stepper-description"]');

    expect(titles).toHaveLength(3);
    expect(descriptions).toHaveLength(3);

    expect(titles[0].text()).toBe('Create Device Password');
    expect(descriptions[0].text()).toBe('Secure your device');

    expect(titles[1].text()).toBe('Activate License');
    expect(descriptions[1].text()).toBe('Create an Unraid.net account and activate your key');

    expect(titles[2].text()).toBe('Unleash Your Hardware');
    expect(descriptions[2].text()).toBe('Device is ready to configure');
  });

  it('uses default activeStep of 1 when not provided', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="stepper"]').attributes('default-value')).toBe('1');
  });

  it('uses provided activeStep value', () => {
    const wrapper = mountComponent({ activeStep: 2 });

    expect(wrapper.find('[data-testid="stepper"]').attributes('default-value')).toBe('2');
  });
});
