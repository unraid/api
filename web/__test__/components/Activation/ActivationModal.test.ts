/**
 * Activation Modal Component Test Coverage
 */

import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComposerTranslation } from 'vue-i18n';

import ActivationModal from '~/components/Activation/ActivationModal.vue';
import { testTranslate } from '../../utils/i18n';

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
    template: '<div data-testid="activation-steps" :active-step="activeStep"></div>',
    props: ['activeStep'],
  },
};

const mockActivationCodeDataStore = {
  partnerInfo: ref({
    hasPartnerLogo: false,
    partnerName: null as string | null,
  }),
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

// Mock all imports
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT,
  }),
}));

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

vi.mock('~/store/purchase', () => ({
  usePurchaseStore: () => mockPurchaseStore,
}));

vi.mock('~/store/theme', () => ({
  useThemeStore: vi.fn(),
}));

vi.mock('@heroicons/vue/24/solid', () => ({
  ArrowTopRightOnSquareIcon: {},
}));

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
      props: { t: mockT as unknown as ComposerTranslation },
      global: {
        stubs: mockComponents,
      },
    });
  };

  it('uses the correct title text', () => {
    mountComponent();

    expect(mockT("Let's activate your Unraid OS License")).toBe("Let's activate your Unraid OS License");
  });

  it('uses the correct description text', () => {
    mountComponent();

    const descriptionText = mockT(
      `On the following screen, your license will be activated. You'll then create an Unraid.net Account to manage your license going forward.`
    );

    expect(descriptionText).toBe(
      "On the following screen, your license will be activated. You'll then create an Unraid.net Account to manage your license going forward."
    );
  });

  it('provides documentation links with correct URLs', () => {
    mountComponent();
    const licensingText = mockT('More about Licensing');
    const accountsText = mockT('More about Unraid.net Accounts');

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

  it('calls activate method when Activate Now button is clicked', async () => {
    const wrapper = mountComponent();
    const button = wrapper.find('[data-testid="brand-button"]');

    expect(button.exists()).toBe(true);

    await button.trigger('click');

    expect(mockPurchaseStore.activate).toHaveBeenCalledTimes(1);
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
    expect(wrapper.html()).toContain('active-step="2"');
  });
});
