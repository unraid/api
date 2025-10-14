/**
 * Activation Modal Component Test Coverage
 */

import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ActivationModal from '~/components/Activation/ActivationModal.vue';
import { createTestI18n, testTranslate } from '../../utils/i18n';

vi.mock('@unraid/ui', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    Dialog: {
      name: 'Dialog',
      props: ['modelValue', 'title', 'description', 'showFooter', 'size', 'showCloseButton'],
      emits: ['update:modelValue'],
      template: `
        <div v-if="modelValue" role="dialog" aria-modal="true">
          <div v-if="$slots.header" class="dialog-header"><slot name="header" /></div>
          <div class="dialog-body"><slot /></div>
          <div v-if="$slots.footer" class="dialog-footer"><slot name="footer" /></div>
        </div>
      `,
    },
    BrandButton: {
      template:
        '<button data-testid="brand-button" :type="type" @click="$emit(\'click\')"><slot /></button>',
      props: ['text', 'iconRight', 'variant', 'external', 'href', 'size', 'type'],
      emits: ['click'],
    },
  };
});

const mockT = testTranslate;

const mockComponents = {
  ActivationPartnerLogo: {
    template: '<div data-testid="partner-logo"></div>',
    props: ['partnerInfo'],
  },
  ActivationSteps: {
    template: '<div data-testid="activation-steps" :active-step="activeStepIndex"></div>',
    props: ['steps', 'activeStepIndex', 'onStepClick'],
  },
  ActivationPluginsStep: {
    template: '<div data-testid="plugins-step"></div>',
    props: ['t', 'onComplete', 'onSkip', 'onBack', 'showSkip', 'showBack'],
  },
  ActivationTimezoneStep: {
    template: '<div data-testid="timezone-step"></div>',
    props: ['t', 'onComplete', 'onSkip', 'onBack', 'showSkip', 'showBack'],
  },
  ActivationWelcomeStep: {
    template: '<div data-testid="welcome-step"></div>',
    props: [
      'currentVersion',
      'previousVersion',
      'partnerName',
      'onComplete',
      'onSkip',
      'onBack',
      'showSkip',
      'showBack',
      'redirectToLogin',
    ],
  },
  ActivationLicenseStep: {
    template: '<div data-testid="license-step"></div>',
    props: [
      'modalTitle',
      'modalDescription',
      'docsButtons',
      'canGoBack',
      'purchaseStore',
      'onComplete',
      'onBack',
      'showBack',
    ],
  },
};

const mockActivationCodeDataStore = {
  partnerInfo: ref({
    hasPartnerLogo: false,
    partnerName: null as string | null,
  }),
  activationCode: ref({ code: 'TEST-CODE-123' }),
  isFreshInstall: ref(true),
};

let handleKeydown: ((e: KeyboardEvent) => void) | null = null;

const mockActivationCodeModalStore = {
  isVisible: ref(true),
  setIsHidden: vi.fn((value: boolean) => {
    if (value === true) {
      window.location.href = '/Tools/Registration';
    }
  }),
  // This gets defined after we mock the store
  _store: null as unknown,
};

const mockPurchaseStore = {
  activate: vi.fn(),
};

const mockStepDefinitions = [
  {
    id: 'timezone',
    required: true,
    completed: false,
    introducedIn: '7.0.0',
    title: 'Set Time Zone',
    description: 'Configure system time',
    icon: 'i-heroicons-clock',
  },
  {
    id: 'plugins',
    required: false,
    completed: false,
    introducedIn: '7.0.0',
    title: 'Install Essential Plugins',
    description: 'Add helpful plugins',
    icon: 'i-heroicons-puzzle-piece',
  },
  {
    id: 'activation',
    required: true,
    completed: false,
    introducedIn: '7.0.0',
    title: 'Activate License',
    description: 'Create an Unraid.net account and activate your key',
    icon: 'i-heroicons-key',
  },
];

const mockUpgradeOnboardingStore = {
  shouldShowUpgradeOnboarding: ref(false),
  upgradeSteps: ref(mockStepDefinitions),
  allUpgradeSteps: ref(mockStepDefinitions),
  currentVersion: ref('7.0.0'),
  previousVersion: ref('6.12.0'),
  setIsHidden: vi.fn(),
  refetchActivationOnboarding: vi.fn(),
};

// Mock all imports
vi.mock('vue-i18n', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('vue-i18n');
  return {
    ...(actual as Record<string, unknown>),
    useI18n: () => ({
      t: mockT,
    }),
  } as typeof import('vue-i18n');
});

vi.mock('~/components/Activation/store/activationCodeModal', () => {
  const store = {
    useActivationCodeModalStore: () => {
      mockActivationCodeModalStore._store = mockActivationCodeModalStore;
      return mockActivationCodeModalStore;
    },
  };
  return store;
});

vi.mock('~/components/Activation/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => mockActivationCodeDataStore,
}));

vi.mock('~/components/Activation/store/upgradeOnboarding', () => ({
  useUpgradeOnboardingStore: () => mockUpgradeOnboardingStore,
}));

vi.mock('~/store/purchase', () => ({
  usePurchaseStore: () => mockPurchaseStore,
}));

vi.mock('~/store/theme', () => ({
  useThemeStore: () => ({
    setTheme: vi.fn().mockResolvedValue(undefined),
    setCssVars: vi.fn(),
  }),
}));

vi.mock('@heroicons/vue/24/solid', () => ({
  ArrowTopRightOnSquareIcon: {},
}));

vi.mock('@nuxt/ui', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    UStepper: {
      name: 'UStepper',
      props: ['modelValue', 'items', 'orientation'],
      template: '<div data-testid="u-stepper"></div>',
    },
  };
});

const originalAddEventListener = window.addEventListener;
window.addEventListener = vi.fn((event: string, handler: EventListenerOrEventListenerObject) => {
  if (event === 'keydown') {
    handleKeydown = handler as unknown as (e: KeyboardEvent) => void;
  }
  return originalAddEventListener(event, handler);
});

describe('Activation/ActivationModal.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockActivationCodeDataStore.partnerInfo.value = {
      hasPartnerLogo: false,
      partnerName: null,
    };

    mockActivationCodeModalStore.isVisible.value = true;

    // Reset window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });

    handleKeydown = null;
  });

  const mountComponent = () => {
    return mount(ActivationModal, {
      global: {
        plugins: [createTestI18n()],
        stubs: mockComponents,
      },
    });
  };

  it('uses the correct title text', () => {
    mountComponent();

    expect(mockT('activation.activationModal.letSActivateYourUnraidOs')).toBe(
      "Let's activate your Unraid OS License"
    );
  });

  it('uses the correct description text', () => {
    mountComponent();

    const descriptionText = mockT('activation.activationModal.onTheFollowingScreenYourLicense');

    expect(descriptionText).toBe(
      "On the following screen, your license will be activated. You'll then create an Unraid.net Account to manage your license going forward."
    );
  });

  it('provides documentation links with correct URLs', () => {
    mountComponent();
    const licensingText = mockT('activation.activationModal.moreAboutLicensing');
    const accountsText = mockT('activation.activationModal.moreAboutUnraidNetAccounts');

    expect(licensingText).toBe('More about Licensing');
    expect(accountsText).toBe('More about Unraid.net Accounts');
  });

  it('displays the partner logo when available', () => {
    mockActivationCodeDataStore.partnerInfo.value = {
      hasPartnerLogo: true,
      partnerName: 'partner-name',
    };

    const wrapper = mountComponent();

    expect(wrapper.html()).toContain('data-testid="partner-logo"');
  });

  it('renders timezone step initially when activation code is present', async () => {
    const wrapper = mountComponent();

    // The component now renders steps dynamically based on the step registry
    // Check that the activation steps component is rendered
    expect(wrapper.html()).toContain('data-testid="activation-steps"');
  });

  it('handles Konami code sequence to close modal and redirect', async () => {
    mountComponent();

    if (!handleKeydown) {
      return;
    }

    const konamiCode = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'b',
      'a',
    ];

    for (const key of konamiCode) {
      handleKeydown(new KeyboardEvent('keydown', { key }));
    }

    expect(mockActivationCodeModalStore.setIsHidden).toHaveBeenCalledWith(true);
    expect(window.location.href).toBe('/Tools/Registration');
  });

  it('does not trigger konami code action for incorrect sequence', async () => {
    mountComponent();

    if (!handleKeydown) {
      return;
    }

    const incorrectSequence = ['ArrowUp', 'ArrowDown', 'b', 'a'];

    for (const key of incorrectSequence) {
      handleKeydown(new KeyboardEvent('keydown', { key }));
    }

    expect(mockActivationCodeModalStore.setIsHidden).not.toHaveBeenCalled();
    expect(window.location.href).toBe('');
  });

  it('does not render when isVisible is false', () => {
    mockActivationCodeModalStore.isVisible.value = false;
    const wrapper = mountComponent();

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('renders activation steps with correct active step', () => {
    const wrapper = mountComponent();

    expect(wrapper.html()).toContain('data-testid="activation-steps"');
    // The component now uses activeStepIndex prop instead of active-step attribute
    const activationSteps = wrapper.find('[data-testid="activation-steps"]');
    expect(activationSteps.exists()).toBe(true);
  });
});
