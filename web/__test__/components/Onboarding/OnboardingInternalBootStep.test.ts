import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GetInternalBootContextQuery } from '~/composables/gql/graphql';

import OnboardingInternalBootStep from '~/components/Onboarding/steps/OnboardingInternalBootStep.vue';
import {
  ArrayState,
  DiskInterfaceType,
  GetInternalBootContextDocument,
} from '~/composables/gql/graphql';
import { createTestI18n } from '../../utils/i18n';

type MockInternalBootSelection = {
  poolName: string;
  slotCount: number;
  devices: string[];
  bootSizeMiB: number;
  updateBios: boolean;
};

const { draftStore, contextResult, contextLoading, contextError, useQueryMock } = vi.hoisted(() => {
  const store = {
    bootMode: 'usb' as 'usb' | 'storage',
    internalBootSelection: null as MockInternalBootSelection | null,
    skipInternalBoot: vi.fn(),
    setBootMode: vi.fn<(mode: 'usb' | 'storage') => void>(),
    setInternalBootSelection: vi.fn<(selection: MockInternalBootSelection) => void>(),
  };

  store.setBootMode.mockImplementation((mode: 'usb' | 'storage') => {
    store.bootMode = mode;
  });
  store.setInternalBootSelection.mockImplementation((selection: MockInternalBootSelection) => {
    store.internalBootSelection = selection;
  });

  return {
    draftStore: store,
    contextResult: { value: null as GetInternalBootContextQuery | null, __v_isRef: true },
    contextLoading: { value: false, __v_isRef: true },
    contextError: { value: null as unknown, __v_isRef: true },
    useQueryMock: vi.fn(),
  };
});

vi.mock('@unraid/ui', () => ({
  BrandButton: {
    props: ['text', 'disabled', 'loading'],
    emits: ['click'],
    template:
      '<button data-testid="brand-button" :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
  },
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: useQueryMock,
}));

useQueryMock.mockImplementation(() => ({
  result: contextResult,
  loading: contextLoading,
  error: contextError,
}));

vi.mock('@/components/Onboarding/store/onboardingDraft', () => ({
  useOnboardingDraftStore: () => draftStore,
}));

const gib = (value: number) => value * 1024 * 1024 * 1024;

const mountComponent = () =>
  mount(OnboardingInternalBootStep, {
    props: {
      onComplete: vi.fn(),
      showBack: true,
    },
    global: {
      plugins: [createTestI18n()],
    },
  });

describe('OnboardingInternalBootStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    draftStore.bootMode = 'usb';
    draftStore.internalBootSelection = null;
    contextLoading.value = false;
    contextError.value = null;
    contextResult.value = null;
  });

  it('renders all available server and disk eligibility codes when storage boot is blocked', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = {
      array: {
        state: ArrayState.STARTED,
        caches: [{ name: 'cache' }],
      },
      vars: {
        fsState: 'Started',
        bootEligible: null,
        enableBootTransfer: 'maybe',
        reservedNames: '',
      },
      shares: [],
      assignableDisks: [
        {
          device: '/dev/sda',
          size: gib(32),
          serialNum: 'BOOT-1',
          interfaceType: DiskInterfaceType.SATA,
        },
        {
          device: '/dev/sdb',
          size: gib(32),
          serialNum: 'PARITY-1',
          interfaceType: DiskInterfaceType.SATA,
        },
        {
          device: '/dev/sdc',
          size: gib(32),
          serialNum: 'ARRAY-1',
          interfaceType: DiskInterfaceType.SATA,
        },
        {
          device: '/dev/sdd',
          size: gib(32),
          serialNum: 'CACHE-1',
          interfaceType: DiskInterfaceType.SATA,
        },
        {
          device: '/dev/sde',
          size: gib(6),
          serialNum: 'SMALL-1',
          interfaceType: DiskInterfaceType.SATA,
        },
        {
          device: '/dev/sdf',
          size: gib(32),
          serialNum: 'USB-1',
          interfaceType: DiskInterfaceType.USB,
        },
      ],
    };

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-eligibility-panel"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="internal-boot-intro-panel"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('No eligible devices were detected for internal boot setup.');
    expect(wrapper.text()).not.toContain('ARRAY_NOT_STOPPED');
    await wrapper.get('[data-testid="internal-boot-eligibility-toggle"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('ARRAY_NOT_STOPPED');
    expect(wrapper.text()).toContain('ENABLE_BOOT_TRANSFER_UNKNOWN');
    expect(wrapper.text()).toContain('BOOT_ELIGIBLE_UNKNOWN');
    expect(wrapper.text()).toContain('TOO_SMALL');
    expect(wrapper.text()).not.toContain('NO_UNASSIGNED_DISKS');
    expect(wrapper.find('[data-testid="brand-button"]').attributes('disabled')).toBeDefined();
  });

  it('loads internal boot context from the network when the step mounts', async () => {
    mountComponent();
    await flushPromises();

    expect(useQueryMock).toHaveBeenCalledWith(
      GetInternalBootContextDocument,
      null,
      expect.objectContaining({
        fetchPolicy: 'network-only',
      })
    );
  });

  it('shows drive serials in the selectable device labels', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = {
      array: {
        state: ArrayState.STOPPED,
        caches: [],
      },
      vars: {
        fsState: 'Stopped',
        bootEligible: true,
        enableBootTransfer: 'yes',
        reservedNames: '',
      },
      shares: [],
      assignableDisks: [
        {
          device: '/dev/sda',
          size: gib(32),
          serialNum: 'WD-TEST-1234',
          interfaceType: DiskInterfaceType.SATA,
        },
      ],
    };

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.text()).toContain('WD-TEST-1234 - 34.4 GB (sda)');
    expect(wrapper.text()).not.toContain('eligible-disk - 34.4 GB (sda)');
  });

  it('defaults the storage pool name to cache', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = {
      array: {
        state: ArrayState.STOPPED,
        caches: [],
      },
      vars: {
        fsState: 'Stopped',
        bootEligible: true,
        enableBootTransfer: 'yes',
        reservedNames: '',
      },
      shares: [],
      assignableDisks: [
        {
          device: '/dev/sda',
          size: gib(32),
          serialNum: 'ELIGIBLE-1',
          interfaceType: DiskInterfaceType.SATA,
        },
      ],
    };

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-intro-panel"]').exists()).toBe(true);
    expect(wrapper.get('input[type="text"]').element).toHaveProperty('value', 'cache');
    expect(wrapper.text()).toContain(
      'The name you choose below applies to the storage pool, not the boot volume.'
    );
  });

  it('leaves the pool name blank when cache already exists', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = {
      array: {
        state: ArrayState.STOPPED,
        caches: [{ name: 'cache' }],
      },
      vars: {
        fsState: 'Stopped',
        bootEligible: true,
        enableBootTransfer: 'yes',
        reservedNames: '',
      },
      shares: [],
      assignableDisks: [
        {
          device: '/dev/sda',
          size: gib(32),
          serialNum: 'ELIGIBLE-1',
          interfaceType: DiskInterfaceType.SATA,
        },
      ],
    };

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.get('input[type="text"]').element).toHaveProperty('value', '');
  });

  it('shows explicit disabled and empty-disk codes when the system reports them', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = {
      array: {
        state: ArrayState.STOPPED,
        caches: [],
      },
      vars: {
        fsState: 'Stopped',
        bootEligible: false,
        enableBootTransfer: 'no',
        reservedNames: '',
      },
      shares: [],
      assignableDisks: [],
    };

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.get('[data-testid="internal-boot-eligibility-toggle"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('ENABLE_BOOT_TRANSFER_DISABLED');
    expect(wrapper.text()).toContain('BOOT_ELIGIBLE_FALSE');
    expect(wrapper.text()).toContain('NO_UNASSIGNED_DISKS');
  });

  it('blocks configuration when internal boot is already configured while the system is still booted from flash', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = {
      array: {
        state: ArrayState.STOPPED,
        caches: [],
      },
      vars: {
        fsState: 'Stopped',
        bootEligible: true,
        bootedFromFlashWithInternalBootSetup: true,
        enableBootTransfer: 'yes',
        reservedNames: '',
      },
      shares: [],
      assignableDisks: [
        {
          device: '/dev/sda',
          size: gib(32),
          serialNum: 'ELIGIBLE-1',
          interfaceType: DiskInterfaceType.SATA,
        },
      ],
    };

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.get('[data-testid="internal-boot-eligibility-toggle"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('ALREADY_INTERNAL_BOOT');
    expect(wrapper.find('[data-testid="brand-button"]').attributes('disabled')).toBeDefined();
  });

  it('keeps the blocked headline focused on server state when eligible disks exist', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = {
      array: {
        state: ArrayState.STARTED,
        caches: [],
      },
      vars: {
        fsState: 'Started',
        bootEligible: true,
        enableBootTransfer: 'yes',
        reservedNames: '',
      },
      shares: [],
      assignableDisks: [
        {
          device: '/dev/sda',
          size: gib(32),
          serialNum: 'ELIGIBLE-1',
          interfaceType: DiskInterfaceType.SATA,
        },
      ],
    };

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-intro-panel"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Storage boot is currently unavailable');
    expect(wrapper.text()).not.toContain('No eligible devices were detected for internal boot setup.');
  });

  it('shows disk-level ineligibility while keeping the form available for eligible disks', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = {
      array: {
        state: ArrayState.STOPPED,
        caches: [{ name: 'cache' }],
      },
      vars: {
        fsState: 'Stopped',
        bootEligible: true,
        enableBootTransfer: 'yes',
        reservedNames: '',
      },
      shares: [],
      assignableDisks: [
        {
          device: '/dev/sdb',
          size: gib(6),
          serialNum: 'SMALL-1',
          interfaceType: DiskInterfaceType.SATA,
        },
        {
          device: '/dev/sdc',
          size: gib(32),
          serialNum: 'ELIGIBLE-1',
          interfaceType: DiskInterfaceType.SATA,
        },
        {
          device: '/dev/sdd',
          size: gib(32),
          serialNum: 'USB-1',
          interfaceType: DiskInterfaceType.USB,
        },
      ],
    };

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-eligibility-panel"]').exists()).toBe(true);
    const selects = wrapper.findAll('select');
    expect(selects).toHaveLength(3);
    const deviceSelect = selects[1];
    expect(deviceSelect.text()).toContain('ELIGIBLE-1');
    expect(deviceSelect.text()).toContain('USB-1');
    expect(deviceSelect.text()).not.toContain('CACHE-1');
    expect(deviceSelect.text()).not.toContain('SMALL-1');
    const biosWarning = wrapper.get('[data-testid="internal-boot-update-bios-warning"]');
    const eligibilityPanel = wrapper.get('[data-testid="internal-boot-eligibility-panel"]');
    expect(
      biosWarning.element.compareDocumentPosition(eligibilityPanel.element) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    await wrapper.get('[data-testid="internal-boot-eligibility-toggle"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('TOO_SMALL');
    expect(wrapper.find('[data-testid="brand-button"]').attributes('disabled')).toBeUndefined();
  });

  it('treats disks present in devs.ini as assignable', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = {
      array: {
        state: ArrayState.STOPPED,
        caches: [],
      },
      vars: {
        fsState: 'Stopped',
        bootEligible: true,
        enableBootTransfer: 'yes',
        reservedNames: '',
      },
      shares: [],
      assignableDisks: [
        {
          device: '/dev/sda',
          size: gib(32),
          serialNum: 'UNASSIGNED-1',
          interfaceType: DiskInterfaceType.SATA,
        },
      ],
    };

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-intro-panel"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="internal-boot-eligibility-panel"]').exists()).toBe(false);
    const selects = wrapper.findAll('select');
    expect(selects).toHaveLength(3);
    expect(selects[1]?.text()).toContain('UNASSIGNED-1');
    expect(wrapper.text()).not.toContain('ASSIGNED_TO_ARRAY');
    expect(wrapper.text()).not.toContain('NO_UNASSIGNED_DISKS');
    expect(wrapper.find('[data-testid="brand-button"]').attributes('disabled')).toBeUndefined();
  });
});
