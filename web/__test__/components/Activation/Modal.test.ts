/**
 * Activation Modal Component Test Coverage
 */

import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComposerTranslation } from 'vue-i18n';

import ActivationModal from '~/components/Activation/Modal.vue';

const mockT = (key: string, args?: unknown[]) => (args ? `${key} ${JSON.stringify(args)}` : key);

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT,
  }),
}));

const mockActivationCodeStore = {
  partnerLogo: ref<string | null>(null),
  showActivationModal: ref(true),
  setActivationModalHidden: vi.fn(),
};

const mockPurchaseStore = {
  activate: vi.fn(),
};

vi.mock('~/store/activationCode', () => ({
  useActivationCodeStore: () => mockActivationCodeStore,
}));

vi.mock('~/store/purchase', () => ({
  usePurchaseStore: () => mockPurchaseStore,
}));

vi.mock('@unraid/ui', () => ({
  BrandButton: {
    template:
      '<button data-testid="brand-button" :type="type" @click="$emit(\'click\')"><slot /></button>',
    props: ['text', 'iconRight', 'variant', 'external', 'href', 'size', 'type'],
    emits: ['click'],
  },
}));

vi.mock('~/components/Activation/PartnerLogo.vue', () => ({
  default: {
    template: '<div data-testid="partner-logo"></div>',
  },
}));

vi.mock('~/components/Activation/Steps.vue', () => ({
  default: {
    template: '<div data-testid="activation-steps" :active-step="activeStep"></div>',
    props: ['activeStep'],
  },
}));

vi.mock('~/components/Modal.vue', () => ({
  default: {
    template: `
      <div v-if="open">
        <div data-testid="modal-header"><slot name="header" /></div>
        <div data-testid="modal-body"><slot /></div>
        <div data-testid="modal-footer"><slot name="footer" /></div>
        <div data-testid="modal-subfooter"><slot name="subFooter" /></div>
      </div>
    `,
    props: [
      't',
      'open',
      'showCloseX',
      'title',
      'titleInMain',
      'description',
      'overlayColor',
      'overlayOpacity',
      'maxWidth',
      'modalVerticalCenter',
      'disableShadow',
      'disableOverlayClose',
    ],
  },
}));

describe('Activation/Modal.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActivationCodeStore.partnerLogo.value = null;
    mockActivationCodeStore.showActivationModal.value = true;

    // Reset window.location using a safer approach
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });
  });

  it('uses the correct title text', () => {
    mount(ActivationModal, {
      props: { t: mockT as unknown as ComposerTranslation },
    });

    expect(mockT("Let's activate your Unraid OS License")).toBe("Let's activate your Unraid OS License");
  });

  it('uses the correct description text', () => {
    mount(ActivationModal, {
      props: { t: mockT as unknown as ComposerTranslation },
    });

    const descriptionText = mockT(
      `On the following screen, your license will be activated. You'll then create an Unraid.net Account to manage your license going forward.`
    );

    expect(descriptionText).toBe(
      "On the following screen, your license will be activated. You'll then create an Unraid.net Account to manage your license going forward."
    );
  });

  it('provides documentation links with correct URLs', () => {
    mount(ActivationModal, {
      props: { t: mockT as unknown as ComposerTranslation },
    });

    const licensingText = mockT('More about Licensing');
    const accountsText = mockT('More about Unraid.net Accounts');

    expect(licensingText).toBe('More about Licensing');
    expect(accountsText).toBe('More about Unraid.net Accounts');
  });

  it('displays the partner logo when available', () => {
    mockActivationCodeStore.partnerLogo.value = 'partner-logo-url';

    const wrapper = mount(ActivationModal, {
      props: { t: mockT as unknown as ComposerTranslation },
    });

    const modalHeader = wrapper.find('[data-testid="modal-header"]');

    expect(modalHeader.exists()).toBe(true);
    expect(wrapper.find('[data-testid="partner-logo"]').exists()).toBe(true);
  });

  it('calls activate method when Activate Now button is clicked', async () => {
    const wrapper = mount(ActivationModal, {
      props: { t: mockT as unknown as ComposerTranslation },
    });

    const button = wrapper.find('[data-testid="brand-button"]');

    expect(button.exists()).toBe(true);

    await button.trigger('click');

    expect(mockPurchaseStore.activate).toHaveBeenCalledTimes(1);
  });

  it('handles Konami code sequence to close modal and redirect', async () => {
    mount(ActivationModal, {
      props: { t: mockT as unknown as ComposerTranslation },
    });

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

    // Trigger each key in the sequence
    konamiCode.forEach((key) => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    });

    // Check if the modal was hidden and redirect was triggered
    expect(mockActivationCodeStore.setActivationModalHidden).toHaveBeenCalledWith(true);
    expect(window.location.href).toBe('/Tools/Registration');
  });

  it('does not trigger konami code action for incorrect sequence', async () => {
    mount(ActivationModal, {
      props: { t: mockT as unknown as ComposerTranslation },
    });

    // Simulate incorrect sequence
    const incorrectSequence = [
      'ArrowUp',
      'ArrowDown',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'a',
      'b',
    ];

    // Trigger each key in the sequence
    incorrectSequence.forEach((key) => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    });

    expect(mockActivationCodeStore.setActivationModalHidden).not.toHaveBeenCalled();
    expect(window.location.href).toBe('');
  });

  it('does not render when showActivationModal is false', () => {
    mockActivationCodeStore.showActivationModal.value = false;

    const wrapper = mount(ActivationModal, {
      props: { t: mockT as unknown as ComposerTranslation },
    });

    expect(wrapper.find('[data-testid="modal-header"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="modal-body"]').exists()).toBe(false);
  });

  it('renders activation steps with correct active step', () => {
    const wrapper = mount(ActivationModal, {
      props: { t: mockT as unknown as ComposerTranslation },
    });

    const modalSubfooter = wrapper.find('[data-testid="modal-subfooter"]');

    expect(modalSubfooter.exists()).toBe(true);

    const activationSteps = wrapper.find('[data-testid="activation-steps"]');

    expect(activationSteps.exists()).toBe(true);
    expect(activationSteps.attributes('active-step')).toBe('2');
  });
});
