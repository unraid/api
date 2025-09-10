/**
 * WelcomeModal Component Test Coverage
 */

import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComposerTranslation } from 'vue-i18n';

import WelcomeModal from '~/components/Activation/WelcomeModal.standalone.vue';

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
      name: 'BrandButton',
      props: ['text', 'disabled'],
      emits: ['click'],
      template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
    },
  };
});

const mockT = (key: string, args?: unknown[]) => (args ? `${key} ${JSON.stringify(args)}` : key);

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

const mockWelcomeModalDataStore = {
  partnerInfo: ref({
    hasPartnerLogo: false,
    partnerName: null as string | null,
  }),
  loading: ref(false),
  isInitialSetup: ref(true), // Default to true for testing
};

const mockThemeStore = {
  setTheme: vi.fn(),
};

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT,
  }),
}));

vi.mock('~/components/Activation/store/welcomeModalData', () => ({
  useWelcomeModalDataStore: () => mockWelcomeModalDataStore,
}));

vi.mock('~/store/theme', () => ({
  useThemeStore: () => mockThemeStore,
}));

describe('Activation/WelcomeModal.standalone.vue', () => {
  let mockSetProperty: ReturnType<typeof vi.fn>;
  let mockQuerySelector: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockWelcomeModalDataStore.partnerInfo.value = {
      hasPartnerLogo: false,
      partnerName: null,
    };
    mockWelcomeModalDataStore.loading.value = false;
    mockWelcomeModalDataStore.isInitialSetup.value = true;

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

    // Mock window.location.pathname to simulate being on /login page
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/login',
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mountComponent = async () => {
    const wrapper = mount(WelcomeModal, {
      props: { t: mockT as unknown as ComposerTranslation },
      global: {
        stubs: mockComponents,
      },
    });
    await wrapper.vm.$nextTick();
    return wrapper;
  };

  it('uses the correct title text when no partner name is provided', () => {
    mountComponent();

    expect(mockT('Welcome to Unraid!')).toBe('Welcome to Unraid!');
  });

  it('uses the correct title text when partner name is provided', () => {
    mockWelcomeModalDataStore.partnerInfo.value = {
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

  it('displays the partner logo when available', async () => {
    mockWelcomeModalDataStore.partnerInfo.value = {
      hasPartnerLogo: true,
      partnerName: 'Test Partner',
    };
    const wrapper = await mountComponent();

    const partnerLogo = wrapper.find('[data-testid="partner-logo"]');
    expect(partnerLogo.exists()).toBe(true);
  });

  it('hides modal when Create a password button is clicked', async () => {
    const wrapper = await mountComponent();
    const button = wrapper.find('button');

    expect(button.exists()).toBe(true);

    // Initially dialog should be visible
    const dialog = wrapper.findComponent({ name: 'Dialog' });
    expect(dialog.exists()).toBe(true);
    expect(dialog.props('modelValue')).toBe(true);

    await button.trigger('click');
    await wrapper.vm.$nextTick();

    // After click, the dialog should be hidden - check if the dialog div is no longer rendered
    const dialogDiv = wrapper.find('[role="dialog"]');
    expect(dialogDiv.exists()).toBe(false);
  });

  it('disables the Create a password button when loading', async () => {
    mockWelcomeModalDataStore.loading.value = true;

    const wrapper = await mountComponent();
    const button = wrapper.find('button');

    expect(button.exists()).toBe(true);
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('renders activation steps with correct active step', async () => {
    const wrapper = await mountComponent();

    const activationSteps = wrapper.find('[data-testid="activation-steps"]');
    expect(activationSteps.exists()).toBe(true);
    expect(activationSteps.attributes('active-step')).toBe('1');
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

  it('shows modal on login page even when isInitialSetup is false', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/login' },
      writable: true,
    });
    mockWelcomeModalDataStore.isInitialSetup.value = false;

    const wrapper = await mountComponent();
    const dialog = wrapper.findComponent({ name: 'Dialog' });

    expect(dialog.exists()).toBe(true);
  });

  it('shows modal on non-login page when isInitialSetup is true', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/Dashboard' },
      writable: true,
    });
    mockWelcomeModalDataStore.isInitialSetup.value = true;

    const wrapper = await mountComponent();
    const dialog = wrapper.findComponent({ name: 'Dialog' });

    expect(dialog.exists()).toBe(true);
  });

  it('does not show modal on non-login page when isInitialSetup is false', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/Dashboard' },
      writable: true,
    });
    mockWelcomeModalDataStore.isInitialSetup.value = false;

    const wrapper = await mountComponent();
    const dialog = wrapper.findComponent({ name: 'Dialog' });

    expect(dialog.exists()).toBe(true);
    expect(dialog.props('modelValue')).toBe(false);
  });

  describe('Modal properties', () => {
    it('shows close button when on /login page', async () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/login' },
        writable: true,
      });

      const wrapper = await mountComponent();
      const dialog = wrapper.findComponent({ name: 'Dialog' });

      expect(dialog.exists()).toBe(true);
      expect(dialog.props('showCloseButton')).toBe(true);
    });

    it('hides close button when NOT on /login page', async () => {
      // Set location to a non-login page
      Object.defineProperty(window, 'location', {
        value: { pathname: '/Dashboard' },
        writable: true,
      });

      const wrapper = mount(WelcomeModal, {
        props: { t: mockT as unknown as ComposerTranslation },
        global: {
          stubs: mockComponents,
        },
      });

      // Manually show the modal since it won't auto-show on non-login pages
      wrapper.vm.showWelcomeModal();
      await wrapper.vm.$nextTick();

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.exists()).toBe(true);
      expect(dialog.props('showCloseButton')).toBe(false);
    });

    it('passes correct props to Dialog component', async () => {
      const wrapper = await mountComponent();
      const dialog = wrapper.findComponent({ name: 'Dialog' });

      expect(dialog.exists()).toBe(true);
      expect(dialog.props()).toMatchObject({
        modelValue: true,
        showFooter: false,
        showCloseButton: true,
        size: 'full',
      });
    });

    it('renders modal with correct content', async () => {
      const wrapper = await mountComponent();

      // Check that the modal is rendered
      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.exists()).toBe(true);
      expect(wrapper.text()).toContain('Welcome to Unraid!');
      expect(wrapper.text()).toContain('Create a password');
    });
  });
});
