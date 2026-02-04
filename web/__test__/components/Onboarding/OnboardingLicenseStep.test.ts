import { mount } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OnboardingLicenseStep from '~/components/Onboarding/steps/OnboardingLicenseStep.vue';
import { createTestI18n } from '../../utils/i18n';

vi.mock('@unraid/ui', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    BrandButton: {
      template: '<button @click="$emit(\'click\')"><slot /></button>',
      props: ['text', 'iconRight'],
    },
    isDarkModeActive: vi.fn(() => false),
  };
});

vi.mock('@heroicons/vue/24/solid', () => {
  // List of icons used in component AND server store
  const icons = [
    'ArrowTopRightOnSquareIcon',
    'ChevronLeftIcon',
    'KeyIcon',
    'ChevronRightIcon',
    'ArrowPathIcon',
    'ArrowRightOnRectangleIcon',
    'CogIcon',
    'GlobeAltIcon',
    'InformationCircleIcon',
    'QuestionMarkCircleIcon',
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
  let windowOpenMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    windowOpenMock = vi.fn();
    vi.stubGlobal('open', windowOpenMock);

    // Mock location robustly
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        href: 'http://localhost/',
        hostname: 'localhost',
        assign: vi.fn(),
        replace: vi.fn(),
        reload: vi.fn(),
        search: '',
        pathname: '/',
      },
    });
  });

  const mountComponent = (props = {}, initialState = {}) => {
    return mount(OnboardingLicenseStep, {
      global: {
        plugins: [
          createTestI18n(),
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              server: {
                registered: false,
                guid: 'TEST-GUID-123',
                ...initialState,
              },
            },
          }),
        ],
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

  it('renders the correct title and initial unregistered state', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('System Activation');
    expect(wrapper.text()).toContain('Unregistered');
    expect(wrapper.text()).toContain('TEST-GUID-123');

    // Check text-red-500
    const statusSpans = wrapper.findAll('span.text-red-500');
    expect(statusSpans.length).toBeGreaterThan(0);
    expect(statusSpans[0].text()).toBe('Unregistered');
  });

  it('renders registered state correctly', () => {
    const wrapper = mountComponent({}, { registered: true });

    expect(wrapper.text()).toContain('Registered');

    // Check text-green-500
    const statusSpans = wrapper.findAll('span.text-green-500');
    expect(statusSpans.length).toBeGreaterThan(0);
    expect(statusSpans[0].text()).toBe('Registered');
  });

  it('opens activation link in new tab when button clicked', async () => {
    const wrapper = mountComponent({
      activateHref: 'https://activation.url',
      activateExternal: true,
    });

    // Find Activate Server button
    const buttons = wrapper.findAll('button');
    const activateButton = buttons.find((b) => b.text().includes('Activate Server'));

    await activateButton?.trigger('click');
    expect(windowOpenMock).toHaveBeenCalledWith('https://activation.url', '_blank');
  });

  it('calls onComplete when Skip is clicked', async () => {
    const onCompleteMock = vi.fn();
    const wrapper = mountComponent({
      onComplete: onCompleteMock,
      allowSkip: true,
    });

    const skipButton = wrapper.findAll('button').find((b) => b.text().includes('Skip For Now'));
    expect(skipButton?.exists()).toBe(true);

    await skipButton?.trigger('click');
    expect(onCompleteMock).toHaveBeenCalled();
  });

  it('does not show Skip button if allowsSkip is false', () => {
    const wrapper = mountComponent({
      allowSkip: false,
    });

    const skipButton = wrapper.findAll('button').find((b) => b.text().includes('Skip For Now'));
    expect(skipButton).toBeUndefined();
  });

  it('calls onBack when Back button clicked', async () => {
    const onBackMock = vi.fn();
    const wrapper = mountComponent({
      onBack: onBackMock,
      showBack: true,
    });

    const backButton = wrapper.findAll('button').find((b) => b.text().includes('Back'));
    await backButton?.trigger('click');
    expect(onBackMock).toHaveBeenCalled();
  });
});
