/**
 * Activation Steps Component Test Coverage
 */

import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import ActivationSteps from '~/components/Activation/Steps.vue';

vi.mock('@unraid/ui', () => ({
  Button: { template: '<button><slot /></button>' },
  Stepper: {
    template: '<div class="mock-stepper" :default-value="defaultValue"><slot /></div>',
    props: ['defaultValue'],
  },
  StepperItem: {
    template:
      '<div class="mock-stepper-item" :step="step" :disabled="disabled"><slot state="active" /></div>',
    props: ['step', 'disabled', 'class'],
  },
  StepperTitle: { template: '<div><slot /></div>' },
  StepperDescription: { template: '<div><slot /></div>' },
  StepperTrigger: { template: '<div><slot /></div>' },
  StepperSeparator: { template: '<div class="mock-separator"></div>', props: ['class'] },
}));

const stubs = {
  CheckIcon: true,
  KeyIcon: true,
  ServerStackIcon: true,
  LockClosedIcon: true,
};

vi.mock('@heroicons/vue/24/outline', () => ({
  CheckIcon: { template: '<svg data-testid="check-icon-outline" />' },
  KeyIcon: { template: '<svg data-testid="key-icon-outline" />' },
  ServerStackIcon: { template: '<svg data-testid="server-stack-icon-outline" />' },
}));

vi.mock('@heroicons/vue/24/solid', () => ({
  KeyIcon: { template: '<svg data-testid="key-icon-solid" />' },
  LockClosedIcon: { template: '<svg data-testid="lock-closed-icon-solid" />' },
  ServerStackIcon: { template: '<svg data-testid="server-stack-icon-solid" />' },
}));

describe('Activation/Steps.vue', () => {
  it('renders all steps with default active step (1)', () => {
    const wrapper = mount(ActivationSteps, {
      global: {
        stubs,
      },
    });

    expect(wrapper.text()).toContain('Create Device Password');
    expect(wrapper.text()).toContain('Secure your device');
    expect(wrapper.text()).toContain('Activate License');
    expect(wrapper.text()).toContain('Create an Unraid.net account and activate your key');
    expect(wrapper.text()).toContain('Unleash Your Hardware');
    expect(wrapper.text()).toContain('Device is ready to configure');

    // Default active step should be 1
    expect(wrapper.find('.mock-stepper').attributes('default-value')).toBe('1');
  });

  it('accepts a custom active step value', () => {
    const wrapper = mount(ActivationSteps, {
      props: {
        activeStep: 2,
      },
      global: {
        stubs,
      },
    });

    expect(wrapper.find('.mock-stepper').attributes('default-value')).toBe('2');
  });

  it('contains the correct number of step items', () => {
    const wrapper = mount(ActivationSteps, {
      global: {
        stubs,
      },
    });

    const stepperItems = wrapper.findAll('.mock-stepper-item');

    expect(stepperItems.length).toBe(3);
  });

  it('contains the expected step titles and descriptions', () => {
    const wrapper = mount(ActivationSteps, {
      global: {
        stubs,
      },
    });

    const text = wrapper.text();

    expect(text).toContain('Create Device Password');
    expect(text).toContain('Activate License');
    expect(text).toContain('Unleash Your Hardware');

    expect(text).toContain('Secure your device');
    expect(text).toContain('Create an Unraid.net account and activate your key');
    expect(text).toContain('Device is ready to configure');
  });
});
