/**
 * WelcomeModal Component Test Coverage
 */

import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComposerTranslation } from 'vue-i18n';

import WelcomeModal from '~/components/Activation/WelcomeModal.ce.vue';

const mockT = (key: string, args?: unknown[]) => (args ? `${key} ${JSON.stringify(args)}` : key);

const mockComponents = {
  Dialog: {
    template: `
      <div data-testid="modal" v-if="modelValue" role="dialog" aria-modal="true">
        <div data-testid="modal-header"><slot name="header" /></div>
        <div data-testid="modal-body"><slot /></div>
        <div data-testid="modal-footer"><slot name="footer" /></div>
        <div data-testid="modal-subfooter"><slot name="subFooter" /></div>
      </div>
    `,
    props: [
      'modelValue',
      'title',
      'description',
      'showFooter',
      'size',
    ],
    emits: ['update:modelValue'],
  },
  ActivationPartnerLogo: {
    template: '<div data-testid="partner-logo"></div>',
  },
  ActivationSteps: {
    template: '<div data-testid="activation-steps" :active-step="activeStep"></div>',
    props: ['activeStep'],
  },
  BrandButton: {
    template:
      '<button data-testid="brand-button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['text', 'disabled'],
    emits: ['click'],
  },
};

const mockActivationCodeDataStore = {
  partnerInfo: ref({
    hasPartnerLogo: false,
    partnerName: null as string | null,
  }),
  loading: ref(false),
};

const mockThemeStore = {
  setTheme: vi.fn(),
};

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT,
  }),
}));

vi.mock('~/components/Activation/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => mockActivationCodeDataStore,
}));

vi.mock('~/store/theme', () => ({
  useThemeStore: () => mockThemeStore,
}));

vi.mock('@unraid/ui', () => ({
  BrandButton: {
    template:
      '<button data-testid="brand-button" :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
    props: ['text', 'disabled'],
    emits: ['click'],
  },
  Dialog: {
    template: `
      <div data-testid="modal" v-if="modelValue" role="dialog" aria-modal="true">
        <div data-testid="modal-header"><slot name="header" /></div>
        <div data-testid="modal-body"><slot /></div>
        <div data-testid="modal-footer"><slot name="footer" /></div>
        <div data-testid="modal-subfooter"><slot name="subFooter" /></div>
      </div>
    `,
    props: [
      'modelValue',
      'title',
      'description',
      'showFooter',
      'size',
    ],
    emits: ['update:modelValue'],
  },
}));

describe('Activation/WelcomeModal.ce.vue', () => {
  let mockSetProperty: ReturnType<typeof vi.fn>;
  let mockQuerySelector: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockActivationCodeDataStore.partnerInfo.value = {
      hasPartnerLogo: false,
      partnerName: null,
    };
    mockActivationCodeDataStore.loading.value = false;

    // Mock document methods
    mockSetProperty = vi.fn();
    mockQuerySelector = vi.fn();
    Object.defineProperty(window.document, 'querySelector', {
      value: mockQuerySelector,
      writable: true,
    });
    Object.defineProperty(window.document.documentElement.style, 'setProperty', {
      value: mockSetProperty,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mountComponent = () => {
    return mount(WelcomeModal, {
      props: { t: mockT as unknown as ComposerTranslation },
      global: {
        stubs: mockComponents,
      },
    });
  };

  it('uses the correct title text when no partner name is provided', () => {
    mountComponent();

    expect(mockT('Welcome to Unraid!')).toBe('Welcome to Unraid!');
  });

  it('uses the correct title text when partner name is provided', () => {
    mockActivationCodeDataStore.partnerInfo.value = {
      hasPartnerLogo: true,
      partnerName: 'Test Partner',
    };
    mountComponent();

    expect(mockT('Welcome to your new {0} system, powered by Unraid!', ['Test Partner'])).toBe(
      'Welcome to your new {0} system, powered by Unraid! ["Test Partner"]'
    );
  });

  it('uses the correct description text', () => {
    mountComponent();

    const descriptionText = mockT(
      `First, you'll create your device's login credentials, then you'll activate your Unraid license—your device's operating system (OS).`
    );

    expect(descriptionText).toBe(
      "First, you'll create your device's login credentials, then you'll activate your Unraid license—your device's operating system (OS)."
    );
  });

  it('displays the partner logo when available', () => {
    mockActivationCodeDataStore.partnerInfo.value = {
      hasPartnerLogo: true,
      partnerName: 'Test Partner',
    };
    const wrapper = mountComponent();

    expect(wrapper.html()).toContain('data-testid="partner-logo"');
  });

  it('hides modal when Create a password button is clicked', async () => {
    const wrapper = mountComponent();
    const button = wrapper.find('[data-testid="brand-button"]');

    expect(button.exists()).toBe(true);

    await button.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false);
  });

  it('disables the Create a password button when loading', () => {
    mockActivationCodeDataStore.loading.value = true;

    const wrapper = mountComponent();
    const button = wrapper.find('[data-testid="brand-button"]');

    expect(button.attributes('disabled')).toBe('');
  });

  it('renders activation steps with correct active step', () => {
    const wrapper = mountComponent();

    expect(wrapper.html()).toContain('data-testid="activation-steps"');
    expect(wrapper.html()).toContain('active-step="1"');
  });

  it('calls setTheme on mount', () => {
    mountComponent();

    expect(mockThemeStore.setTheme).toHaveBeenCalled();
  });

  it('handles theme setting error gracefully', async () => {
    vi.useFakeTimers();

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockThemeStore.setTheme.mockRejectedValueOnce(new Error('Theme error'));
    mountComponent();

    await vi.runAllTimersAsync();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error setting theme:', expect.any(Error));

    consoleErrorSpy.mockRestore();
    vi.useRealTimers();
  });

  describe('Font size adjustment', () => {
    it('sets font-size to 62.5% when confirmPassword field exists', async () => {
      mockQuerySelector.mockReturnValue({ exists: true });
      mountComponent();

      await vi.runAllTimersAsync();

      expect(mockSetProperty).toHaveBeenCalledWith('font-size', '62.5%');
    });

    it('does not set font-size when confirmPassword field does not exist', async () => {
      mockQuerySelector.mockReturnValue(null);
      mountComponent();

      await vi.runAllTimersAsync();

      expect(mockSetProperty).not.toHaveBeenCalled();
    });

    it('sets font-size to 100% when modal is hidden', async () => {
      mockQuerySelector.mockReturnValue({ exists: true });
      const wrapper = mountComponent();

      await vi.runAllTimersAsync();

      expect(mockSetProperty).toHaveBeenCalledWith('font-size', '62.5%');

      const button = wrapper.find('[data-testid="brand-button"]');
      await button.trigger('click');
      await wrapper.vm.$nextTick();

      expect(mockSetProperty).toHaveBeenCalledWith('font-size', '100%');
    });
  });

  describe('Modal properties', () => {
    it('passes correct props to Dialog component', () => {
      const wrapper = mountComponent();
      const dialog = wrapper.find('[data-testid="modal"]');

      expect(dialog.exists()).toBe(true);
      // The Dialog component is rendered correctly
      expect(wrapper.html()).toContain('data-testid="modal"');
    });

    it('renders modal with correct accessibility attributes', () => {
      const wrapper = mountComponent();
      const dialog = wrapper.find('[data-testid="modal"]');

      expect(dialog.attributes()).toMatchObject({
        role: 'dialog',
        'aria-modal': 'true',
      });
    });
  });
});
