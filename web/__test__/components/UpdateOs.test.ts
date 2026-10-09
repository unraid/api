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

const mockUpdateOsStore = {
  available: undefined as string | undefined,
  availableWithRenewal: undefined as string | undefined,
  localCheckForUpdate: vi.fn().mockResolvedValue(undefined),
  setModalOpen: vi.fn(),
  updateOsModalVisible: false,
};
vi.mock('~/store/updateOs', () => ({
  useUpdateOsStore: () => mockUpdateOsStore,
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/some/other/path',
  },
  writable: true,
  configurable: true,
});

const UpdateOsStatusStub = {
  template: '<div data-testid="update-os-status">Status</div>',
  props: ['showUpdateCheck', 'title', 'subtitle', 't'],
};
const UpdateOsThirdPartyDriversStub = {
  template: '<div data-testid="third-party-drivers">Third Party</div>',
  props: ['t'],
};
const UpdateOsCheckUpdateResponseModalStub = {
  template: '<div v-if="open" data-testid="update-os-check-response">Check Response</div>',
  props: ['open', 'embedded'],
};
const UpdateOsChangelogModalStub = {
  template: '<div data-testid="update-os-changelog">Changelog</div>',
};

describe('UpdateOs.standalone.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRebootType.value = '';
    mockSetRebootVersion.mockClear();
    mockUpdateOsStore.available = undefined;
    mockUpdateOsStore.availableWithRenewal = undefined;
    mockUpdateOsStore.localCheckForUpdate.mockResolvedValue(undefined);
    mockUpdateOsStore.updateOsModalVisible = false;
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
    it('shows the internal update status when path matches and rebootType is empty', async () => {
      window.location.pathname = '/Tools/Update';
      mockRebootType.value = '';

      const wrapper = mount(UpdateOs, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
          stubs: {
            UpdateOsStatus: UpdateOsStatusStub,
            UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
            UpdateOsCheckUpdateResponseModal: UpdateOsCheckUpdateResponseModalStub,
            UpdateOsChangelogModal: UpdateOsChangelogModalStub,
          },
        },
      });

      await nextTick();

      expect(wrapper.find('[data-testid="update-os-status"]').exists()).toBe(true);
      expect(wrapper.findComponent(UpdateOsStatusStub).props('showUpdateCheck')).toBe(true);
      expect(mockUpdateOsStore.localCheckForUpdate).toHaveBeenCalledTimes(1);
    });

    it('shows status when path does not match', async () => {
      window.location.pathname = '/some/other/path';
      mockRebootType.value = '';

      const wrapper = mount(UpdateOs, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
          stubs: {
            UpdateOsStatus: UpdateOsStatusStub,
            UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
            UpdateOsCheckUpdateResponseModal: UpdateOsCheckUpdateResponseModalStub,
            UpdateOsChangelogModal: UpdateOsChangelogModalStub,
          },
        },
      });

      await nextTick();

      expect(wrapper.find('[data-testid="update-os-status"]').exists()).toBe(true);
      expect(mockUpdateOsStore.localCheckForUpdate).not.toHaveBeenCalled();
      expect(mockUpdateOsStore.setModalOpen).not.toHaveBeenCalled();
    });

    it('shows status when rebootType is not empty', async () => {
      window.location.pathname = '/Tools/Update';
      mockRebootType.value = 'downgrade';

      const wrapper = mount(UpdateOs, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
          stubs: {
            UpdateOsStatus: UpdateOsStatusStub,
            UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
            UpdateOsCheckUpdateResponseModal: UpdateOsCheckUpdateResponseModalStub,
            UpdateOsChangelogModal: UpdateOsChangelogModalStub,
          },
        },
      });

      await nextTick();

      expect(wrapper.find('[data-testid="update-os-status"]').exists()).toBe(true);
      expect(mockUpdateOsStore.localCheckForUpdate).not.toHaveBeenCalled();
      expect(mockUpdateOsStore.setModalOpen).not.toHaveBeenCalled();
    });

    it('opens the update modal when an update is already available', async () => {
      window.location.pathname = '/Tools/Update';
      mockRebootType.value = '';
      mockUpdateOsStore.available = '6.12.5';

      mount(UpdateOs, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
          stubs: {
            UpdateOsStatus: UpdateOsStatusStub,
            UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
            UpdateOsCheckUpdateResponseModal: UpdateOsCheckUpdateResponseModalStub,
            UpdateOsChangelogModal: UpdateOsChangelogModalStub,
          },
        },
      });

      await nextTick();

      expect(mockUpdateOsStore.setModalOpen).toHaveBeenCalledWith(true);
      expect(mockUpdateOsStore.localCheckForUpdate).not.toHaveBeenCalled();
    });

    it('embeds the update response on the Tools update page', async () => {
      window.location.pathname = '/Tools/Update';
      mockRebootType.value = '';
      mockUpdateOsStore.updateOsModalVisible = true;

      const wrapper = mount(UpdateOs, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
          stubs: {
            UpdateOsStatus: UpdateOsStatusStub,
            UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
            UpdateOsCheckUpdateResponseModal: UpdateOsCheckUpdateResponseModalStub,
            UpdateOsChangelogModal: UpdateOsChangelogModalStub,
          },
        },
      });

      await nextTick();

      const checkResponse = wrapper.findComponent(UpdateOsCheckUpdateResponseModalStub);
      expect(checkResponse.exists()).toBe(true);
      expect(checkResponse.props('embedded')).not.toBe(false);
      expect(wrapper.find('[data-testid="update-os-check-response"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="update-os-changelog"]').exists()).toBe(true);
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
            UpdateOsCheckUpdateResponseModal: UpdateOsCheckUpdateResponseModalStub,
            UpdateOsChangelogModal: UpdateOsChangelogModalStub,
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
            UpdateOsCheckUpdateResponseModal: UpdateOsCheckUpdateResponseModalStub,
            UpdateOsChangelogModal: UpdateOsChangelogModalStub,
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
            UpdateOsCheckUpdateResponseModal: UpdateOsCheckUpdateResponseModalStub,
            UpdateOsChangelogModal: UpdateOsChangelogModalStub,
          },
        },
      });

      expect(wrapper.find('[data-testid="update-os-status"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="third-party-drivers"]').exists()).toBe(false);
      expect(wrapper.findComponent(UpdateOsStatusStub).props('subtitle')).toBe('');
    });
  });
});
