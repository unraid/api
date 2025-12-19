/**
 * UpdateOs Component Test Coverage
 */

import { nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UpdateOs from '~/components/UpdateOs.standalone.vue';
import { createTestI18n } from '../utils/i18n';

vi.mock('@unraid/ui', () => ({
  PageContainer: { template: '<div><slot /></div>' },
  BrandButton: {
    template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
  },
}));

const mockAccountStore = {
  updateOs: vi.fn(),
};
vi.mock('~/store/account', () => ({
  useAccountStore: () => mockAccountStore,
}));

const mockRebootType = ref('');
const mockSetRebootVersion = vi.fn();
const mockServerStore = {
  rebootType: mockRebootType,
  setRebootVersion: mockSetRebootVersion,
};
vi.mock('~/store/server', () => ({
  useServerStore: () => mockServerStore,
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/some/other/path',
  },
  writable: true,
  configurable: true,
});

vi.mock('~/helpers/urls', () => ({
  WEBGUI_TOOLS_UPDATE: '/Tools/Update',
}));

const UpdateOsStatusStub = {
  template: '<div data-testid="update-os-status">Status</div>',
  props: ['showUpdateCheck', 'title', 'subtitle', 't'],
};
const UpdateOsThirdPartyDriversStub = {
  template: '<div data-testid="third-party-drivers">Third Party</div>',
  props: ['t'],
};

describe('UpdateOs.standalone.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRebootType.value = '';
    mockSetRebootVersion.mockClear();
    mockAccountStore.updateOs.mockClear();
    window.location.pathname = '/some/other/path';
  });

  it('calls setRebootVersion with prop value on mount', () => {
    const testVersion = '6.12.0';
    mount(UpdateOs, {
      props: { rebootVersion: testVersion },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
        stubs: {
          // Rely on @unraid/ui mock for PageContainer
          UpdateOsStatus: UpdateOsStatusStub,
          UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
        },
      },
    });
    expect(mockSetRebootVersion).toHaveBeenCalledTimes(1);
    expect(mockSetRebootVersion).toHaveBeenCalledWith(testVersion);
  });

  it('calls setRebootVersion with empty string if prop not provided', () => {
    mount(UpdateOs, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
        stubs: {
          // Rely on @unraid/ui mock for PageContainer
          UpdateOsStatus: UpdateOsStatusStub,
          UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
        },
      },
    });
    expect(mockSetRebootVersion).toHaveBeenCalledTimes(1);
    expect(mockSetRebootVersion).toHaveBeenCalledWith(''); // Default prop value
  });

  describe('Initial Rendering and onBeforeMount Logic', () => {
    it('shows account button and does not auto-redirect when path matches and rebootType is empty', async () => {
      window.location.pathname = '/Tools/Update';
      mockRebootType.value = '';

      const wrapper = mount(UpdateOs, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
          stubs: {
            // Rely on @unraid/ui mock for PageContainer & BrandButton
            UpdateOsStatus: UpdateOsStatusStub,
            UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
          },
        },
      });

      await nextTick();

      expect(mockAccountStore.updateOs).not.toHaveBeenCalled();
      expect(wrapper.find('[data-testid="update-os-account-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="update-os-status"]').exists()).toBe(false);
    });

    it('shows status and does not call updateOs when path does not match', async () => {
      window.location.pathname = '/some/other/path';
      mockRebootType.value = '';

      const wrapper = mount(UpdateOs, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
          stubs: {
            // Rely on @unraid/ui mock for PageContainer & BrandLoading
            UpdateOsStatus: UpdateOsStatusStub,
            UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
          },
        },
      });

      await nextTick();

      expect(mockAccountStore.updateOs).not.toHaveBeenCalled();
      expect(wrapper.find('[data-testid="update-os-account-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="update-os-status"]').exists()).toBe(true);
    });

    it('shows status and does not call updateOs when rebootType is not empty', async () => {
      window.location.pathname = '/Tools/Update';
      mockRebootType.value = 'downgrade';

      const wrapper = mount(UpdateOs, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
          stubs: {
            // Rely on @unraid/ui mock for PageContainer & BrandLoading
            UpdateOsStatus: UpdateOsStatusStub,
            UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
          },
        },
      });

      await nextTick();

      expect(mockAccountStore.updateOs).not.toHaveBeenCalled();
      expect(wrapper.find('[data-testid="update-os-account-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="update-os-status"]').exists()).toBe(true);
    });

    it('navigates to account update when the button is clicked', async () => {
      window.location.pathname = '/Tools/Update';
      mockRebootType.value = '';

      const wrapper = mount(UpdateOs, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
          stubs: {
            UpdateOsStatus: UpdateOsStatusStub,
            UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
          },
        },
      });

      await nextTick();

      await wrapper.find('[data-testid="update-os-account-button"]').trigger('click');

      expect(mockAccountStore.updateOs).toHaveBeenCalledWith(true);
    });
  });

  describe('Rendering based on rebootType', () => {
    it('passes correct subtitle when rebootType is "downgrade"', () => {
      mockRebootType.value = 'downgrade';
      const wrapper = mount(UpdateOs, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
          stubs: {
            UpdateOsStatus: UpdateOsStatusStub,
            UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
          },
        },
      });

      const statusStub = wrapper.findComponent(UpdateOsStatusStub);
      expect(statusStub.exists()).toBe(true);
      expect(statusStub.props('subtitle')).toBe(
        'Please finish the initiated downgrade to enable updates.'
      );
      expect(wrapper.find('[data-testid="third-party-drivers"]').exists()).toBe(false);
    });

    it('renders UpdateOsThirdPartyDrivers when rebootType is "thirdPartyDriversDownloading"', () => {
      mockRebootType.value = 'thirdPartyDriversDownloading';
      const wrapper = mount(UpdateOs, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
          stubs: {
            UpdateOsStatus: UpdateOsStatusStub,
            UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
          },
        },
      });

      expect(wrapper.find('[data-testid="update-os-status"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="third-party-drivers"]').exists()).toBe(true);
      expect(wrapper.findComponent(UpdateOsStatusStub).props('subtitle')).toBe('');
    });

    it('renders only UpdateOsStatus for other rebootType values', () => {
      mockRebootType.value = 'update';
      const wrapper = mount(UpdateOs, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
          stubs: {
            UpdateOsStatus: UpdateOsStatusStub,
            UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
          },
        },
      });

      expect(wrapper.find('[data-testid="update-os-status"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="third-party-drivers"]').exists()).toBe(false);
      expect(wrapper.findComponent(UpdateOsStatusStub).props('subtitle')).toBe('');
    });
  });
});
