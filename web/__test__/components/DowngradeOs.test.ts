/**
 * DowngradeOs Component Test Coverage
 */

import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DowngradeOs from '~/components/DowngradeOs.standalone.vue';
import { useServerStore } from '~/store/server';

vi.mock('crypto-js/aes', () => ({
  default: {},
}));

vi.mock('@unraid/shared-callbacks', () => ({
  useCallback: vi.fn(() => ({
    send: vi.fn(),
    watcher: vi.fn(),
  })),
}));

vi.mock('@unraid/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@unraid/ui')>();

  return {
    ...actual,
  };
});

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const PageContainerStub = {
  template: '<div><slot /></div>',
};
const UpdateOsStatusStub = {
  template: '<div />',
  props: ['title', 'subtitle', 'downgradeNotAvailable', 'showExternalDowngrade', 't'],
};
const UpdateOsDowngradeStub = {
  template: '<div />',
  props: ['releaseDate', 'version', 't'],
};
const UpdateOsThirdPartyDriversStub = {
  template: '<div />',
  props: ['t'],
};

describe('DowngradeOs', () => {
  let serverStore: ReturnType<typeof useServerStore>;

  beforeEach(() => {
    const pinia = createTestingPinia({ createSpy: vi.fn });

    setActivePinia(pinia);
    serverStore = useServerStore();
    vi.clearAllMocks();
  });

  it('calls setRebootVersion on mount with prop value', () => {
    const rebootVersionProp = '6.10.0';

    mount(DowngradeOs, {
      props: {
        rebootVersion: rebootVersionProp,
      },
      global: {
        stubs: {
          PageContainer: PageContainerStub,
          UpdateOsStatus: UpdateOsStatusStub,
          UpdateOsDowngrade: UpdateOsDowngradeStub,
          UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
        },
      },
    });

    expect(serverStore.setRebootVersion).toHaveBeenCalledTimes(1);
    expect(serverStore.setRebootVersion).toHaveBeenCalledWith(rebootVersionProp);
  });

  it('renders UpdateOsStatus with initial props', () => {
    const wrapper = mount(DowngradeOs, {
      global: {
        stubs: {
          PageContainer: PageContainerStub,
          UpdateOsStatus: UpdateOsStatusStub,
          UpdateOsDowngrade: UpdateOsDowngradeStub,
          UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
        },
      },
    });

    const statusStub = wrapper.findComponent(UpdateOsStatusStub);

    expect(statusStub.exists()).toBe(true);
    expect(statusStub.props('title')).toBe('Downgrade Unraid OS');
    expect(statusStub.props('subtitle')).toBe('');
    expect(statusStub.props('downgradeNotAvailable')).toBe(true);
    expect(statusStub.props('showExternalDowngrade')).toBe(false);
  });

  it('renders UpdateOsDowngrade when restoreVersion is provided and rebootType is empty', () => {
    serverStore.rebootType = '';

    const wrapper = mount(DowngradeOs, {
      props: {
        restoreVersion: '6.9.2',
        restoreReleaseDate: '2023-01-01',
      },
      global: {
        stubs: {
          PageContainer: PageContainerStub,
          UpdateOsStatus: UpdateOsStatusStub,
          UpdateOsDowngrade: UpdateOsDowngradeStub,
          UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
        },
      },
    });

    const downgradeStub = wrapper.findComponent(UpdateOsDowngradeStub);

    expect(downgradeStub.exists()).toBe(true);
    expect(downgradeStub.props('version')).toBe('6.9.2');
    expect(downgradeStub.props('releaseDate')).toBe('2023-01-01');

    expect(wrapper.findComponent(UpdateOsStatusStub).props('downgradeNotAvailable')).toBe(false);
    expect(wrapper.findComponent(UpdateOsThirdPartyDriversStub).exists()).toBe(false);
  });

  it('renders UpdateOsThirdPartyDrivers when rebootType is thirdPartyDriversDownloading', () => {
    serverStore.rebootType = 'thirdPartyDriversDownloading';

    const wrapper = mount(DowngradeOs, {
      props: {},
      global: {
        stubs: {
          PageContainer: PageContainerStub,
          UpdateOsStatus: UpdateOsStatusStub,
          UpdateOsDowngrade: UpdateOsDowngradeStub,
          UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
        },
      },
    });

    expect(wrapper.findComponent(UpdateOsThirdPartyDriversStub).exists()).toBe(true);
    expect(wrapper.findComponent(UpdateOsDowngradeStub).exists()).toBe(false);
  });

  it('passes correct subtitle to UpdateOsStatus when rebootType is update', () => {
    serverStore.rebootType = 'update';

    const wrapper = mount(DowngradeOs, {
      global: {
        stubs: {
          PageContainer: PageContainerStub,
          UpdateOsStatus: UpdateOsStatusStub,
          UpdateOsDowngrade: UpdateOsDowngradeStub,
          UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
        },
      },
    });

    const statusStub = wrapper.findComponent(UpdateOsStatusStub);
    expect(statusStub.props('subtitle')).toBe(
      'Please finish the initiated update to enable a downgrade.'
    );
  });

  it('passes correct showExternalDowngrade based on osVersionBranch', () => {
    serverStore.osVersionBranch = 'next';

    const wrapper = mount(DowngradeOs, {
      global: {
        stubs: {
          PageContainer: PageContainerStub,
          UpdateOsStatus: UpdateOsStatusStub,
          UpdateOsDowngrade: UpdateOsDowngradeStub,
          UpdateOsThirdPartyDrivers: UpdateOsThirdPartyDriversStub,
        },
      },
    });

    expect(wrapper.findComponent(UpdateOsStatusStub).props('showExternalDowngrade')).toBe(true);
  });
});
