import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import OnboardingLicenseStep from '~/components/Onboarding/steps/OnboardingLicenseStep.vue';
import { createTestI18n } from '../../utils/i18n';

const { serverStoreMock, activationStoreMock } = vi.hoisted(() => ({
  serverStoreMock: {
    state: { value: 'ENOKEYFILE' },
    refreshServerState: vi.fn(),
  },
  activationStoreMock: {
    activationCode: { value: { code: 'TEST-GUID-123' } },
    registrationState: { value: 'ENOKEYFILE' },
    hasActivationCode: { value: true },
  },
}));

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>();
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => store,
  };
});

vi.mock('~/store/server', () => ({
  useServerStore: () => serverStoreMock,
}));

vi.mock('~/components/Onboarding/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => activationStoreMock,
}));

vi.mock('@unraid/ui', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    BrandButton: {
      props: ['text', 'iconRight', 'disabled'],
      emits: ['click'],
      template:
        '<button data-testid="brand-button" :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
    },
    isDarkModeActive: vi.fn(() => false),
  };
});

vi.mock('@heroicons/vue/24/solid', () => {
  const icons = [
    'ArrowPathIcon',
    'ArrowTopRightOnSquareIcon',
    'ChevronLeftIcon',
    'ChevronRightIcon',
    'ExclamationTriangleIcon',
    'EyeIcon',
    'EyeSlashIcon',
    'KeyIcon',
  ];

  return icons.reduce(
    (acc, icon) => {
      acc[icon] = { template: `<svg>${icon}</svg>` };
      return acc;
    },
    {} as Record<string, unknown>
  );
});

describe('OnboardingLicenseStep.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serverStoreMock.state.value = 'ENOKEYFILE';
    activationStoreMock.registrationState.value = 'ENOKEYFILE';
    activationStoreMock.activationCode.value = { code: 'TEST-GUID-123' };

    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        href: 'http://localhost/',
      },
    });

    vi.stubGlobal('open', vi.fn());
  });

  const mountComponent = (props = {}) => {
    return mount(OnboardingLicenseStep, {
      global: {
        plugins: [createTestI18n()],
      },
      props: {
        activateHref: 'https://unraid.net/activate',
        activateExternal: true,
        allowSkip: true,
        showBack: true,
        ...props,
      },
    });
  };

  it('renders unregistered status and activation code', () => {
    const wrapper = mountComponent();

    expect(wrapper.text()).toContain('Unregistered');
    expect(wrapper.text()).toContain('Activate Server');
    expect(wrapper.text()).toContain('Skip for now');
  });

  it('renders registered state and manage button for valid license', () => {
    activationStoreMock.registrationState.value = 'PRO';

    const wrapper = mountComponent();

    expect(wrapper.text()).toContain('Registered');
    expect(wrapper.text()).toContain('Manage License');
  });

  it('opens activation link in new tab when activate button is clicked', async () => {
    const windowOpenMock = vi.fn();
    vi.stubGlobal('open', windowOpenMock);

    const wrapper = mountComponent({
      activateHref: 'https://activation.url',
      activateExternal: true,
    });

    const activateButton = wrapper.findAll('button').find((button) => {
      return button.text().includes('Activate Server');
    });

    expect(activateButton).toBeTruthy();
    await activateButton!.trigger('click');

    expect(windowOpenMock).toHaveBeenCalledWith(
      'https://activation.url',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('calls onComplete when skip is clicked', async () => {
    const onComplete = vi.fn();
    const wrapper = mountComponent({ onComplete, allowSkip: true });

    const skipButton = wrapper
      .findAll('[data-testid="brand-button"]')
      .find((button) => button.text().toLowerCase().includes('skip'));

    expect(skipButton).toBeTruthy();
    await skipButton!.trigger('click');
    await wrapper.vm.$nextTick();

    const confirmSkipButton = wrapper
      .findAll('[data-testid="brand-button"]')
      .find((button) => button.text().toLowerCase().includes('understand'));

    expect(confirmSkipButton).toBeTruthy();
    await confirmSkipButton!.trigger('click');

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when back button is clicked', async () => {
    const onBack = vi.fn();
    const wrapper = mountComponent({ onBack, showBack: true });

    const backButton = wrapper.findAll('button').find((button) => button.text().includes('Back'));

    expect(backButton).toBeTruthy();
    await backButton!.trigger('click');

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
