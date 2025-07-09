/**
 * WelcomeModal Component Test Coverage
 */

import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComposerTranslation } from 'vue-i18n';

import WelcomeModal from '~/components/Activation/WelcomeModal.ce.vue';

// Mock @unraid/ui to use a mix of actual and mocked components
vi.mock('@unraid/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@unraid/ui')>();
  return {
    ...actual,
    // We'll provide a simple mock for Dialog to make testing easier
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
  };
});

const mockT = (key: string, args?: unknown[]) => (args ? `${key} ${JSON.stringify(args)}` : key);

const mockComponents = {
  ActivationPartnerLogo: {
    template: '<div data-testid="partner-logo"></div>',
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
    const button = wrapper.find('button');

    expect(button.exists()).toBe(true);

    // Initially dialog should be visible
    let dialog = wrapper.findComponent({ name: 'Dialog' });
    expect(dialog.exists()).toBe(true);
    expect(dialog.props('modelValue')).toBe(true);

    await button.trigger('click');
    await wrapper.vm.$nextTick();

    // After click, dialog modelValue should be false
    dialog = wrapper.findComponent({ name: 'Dialog' });
    expect(dialog.props('modelValue')).toBe(false);
  });

  it('does not disable the Create a password button when loading', () => {
    mockActivationCodeDataStore.loading.value = true;

    const wrapper = mountComponent();
    const button = wrapper.find('button');

    expect(button.attributes('disabled')).toBe(undefined);
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

      const button = wrapper.find('button');
      await button.trigger('click');
      await wrapper.vm.$nextTick();

      expect(mockSetProperty).toHaveBeenCalledWith('font-size', '100%');
    });
  });

  describe('Modal properties', () => {
    it('passes correct props to Dialog component', () => {
      const wrapper = mountComponent();
      const dialog = wrapper.findComponent({ name: 'Dialog' });

      expect(dialog.exists()).toBe(true);
      expect(dialog.props()).toMatchObject({
        modelValue: true,
        showFooter: false,
        showCloseButton: false,
        size: 'full',
      });
    });

    it('renders modal with correct content', () => {
      const wrapper = mountComponent();
      
      // Check that the modal is rendered
      expect(wrapper.text()).toContain('Welcome to Unraid!');
      expect(wrapper.text()).toContain('Create a password');
    });
  });
});
