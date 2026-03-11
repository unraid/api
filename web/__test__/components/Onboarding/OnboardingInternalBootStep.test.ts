import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import OnboardingInternalBootStep from '~/components/Onboarding/steps/OnboardingInternalBootStep.vue';
import { createTestI18n } from '../../utils/i18n';

type MockInternalBootSelection = {
  poolName: string;
  slotCount: number;
  devices: string[];
  bootSizeMiB: number;
  updateBios: boolean;
};

type MockContext = {
  array: {
    state?: string | null;
    boot?: { device?: string | null } | null;
    parities: Array<{ device?: string | null }>;
    disks: Array<{ device?: string | null }>;
    caches: Array<{ name?: string | null; device?: string | null }>;
  };
  vars?: {
    fsState?: string | null;
    bootEligible?: boolean | null;
    enableBootTransfer?: string | null;
    reservedNames?: string | null;
  } | null;
  shares: Array<{ name?: string | null }>;
  disks: Array<{
    device: string;
    size: number;
    emhttpDeviceId?: string | null;
    interfaceType?: string | null;
  }>;
};

const { draftStore, contextResult, contextLoading, contextError } = vi.hoisted(() => {
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
    contextResult: { value: null as MockContext | null, __v_isRef: true },
    contextLoading: { value: false, __v_isRef: true },
    contextError: { value: null as unknown, __v_isRef: true },
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
  useQuery: () => ({
    result: contextResult,
    loading: contextLoading,
    error: contextError,
  }),
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
        state: 'STARTED',
        boot: { device: '/dev/sda' },
        parities: [{ device: '/dev/sdb' }],
        disks: [{ device: '/dev/sdc' }],
        caches: [{ name: 'cache', device: '/dev/sdd' }],
      },
      vars: {
        fsState: 'Started',
        bootEligible: null,
        enableBootTransfer: 'maybe',
        reservedNames: '',
      },
      shares: [],
      disks: [
        { device: '/dev/sda', size: gib(32), emhttpDeviceId: 'boot-disk', interfaceType: 'SATA' },
        { device: '/dev/sdb', size: gib(32), emhttpDeviceId: 'parity-disk', interfaceType: 'SATA' },
        { device: '/dev/sdc', size: gib(32), emhttpDeviceId: 'array-disk', interfaceType: 'SATA' },
        { device: '/dev/sdd', size: gib(32), emhttpDeviceId: 'cache-disk', interfaceType: 'SATA' },
        { device: '/dev/sde', size: gib(6), emhttpDeviceId: 'small-disk', interfaceType: 'SATA' },
        { device: '/dev/sdf', size: gib(32), emhttpDeviceId: 'usb-disk', interfaceType: 'USB' },
      ],
    };

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-eligibility-panel"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="internal-boot-intro-panel"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('No eligible devices were detected for internal boot setup.');
    expect(wrapper.text()).not.toContain('ARRAY_NOT_STOPPED');
    await wrapper.get('[data-testid="internal-boot-eligibility-toggle"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('ARRAY_NOT_STOPPED');
    expect(wrapper.text()).toContain('ENABLE_BOOT_TRANSFER_UNKNOWN');
    expect(wrapper.text()).toContain('BOOT_ELIGIBLE_UNKNOWN');
    expect(wrapper.text()).toContain('ASSIGNED_TO_BOOT');
    expect(wrapper.text()).toContain('ASSIGNED_TO_PARITY');
    expect(wrapper.text()).toContain('ASSIGNED_TO_ARRAY');
    expect(wrapper.text()).toContain('ASSIGNED_TO_CACHE');
    expect(wrapper.text()).toContain('USB_TRANSPORT');
    expect(wrapper.text()).toContain('TOO_SMALL');
    expect(wrapper.text()).not.toContain('NO_UNASSIGNED_DISKS');
    expect(wrapper.find('[data-testid="brand-button"]').attributes('disabled')).toBeDefined();
  });

  it('defaults the storage pool name to cache', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = {
      array: {
        state: 'STOPPED',
        boot: null,
        parities: [],
        disks: [],
        caches: [],
      },
      vars: {
        fsState: 'Stopped',
        bootEligible: true,
        enableBootTransfer: 'yes',
        reservedNames: '',
      },
      shares: [],
      disks: [
        { device: '/dev/sda', size: gib(32), emhttpDeviceId: 'eligible-disk', interfaceType: 'SATA' },
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
        state: 'STOPPED',
        boot: null,
        parities: [],
        disks: [],
        caches: [{ name: 'cache', device: '/dev/sdz' }],
      },
      vars: {
        fsState: 'Stopped',
        bootEligible: true,
        enableBootTransfer: 'yes',
        reservedNames: '',
      },
      shares: [],
      disks: [
        { device: '/dev/sda', size: gib(32), emhttpDeviceId: 'eligible-disk', interfaceType: 'SATA' },
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
        state: 'STOPPED',
        boot: { device: '/dev/sda' },
        parities: [{ device: '/dev/sdb' }],
        disks: [],
        caches: [],
      },
      vars: {
        fsState: 'Stopped',
        bootEligible: false,
        enableBootTransfer: 'no',
        reservedNames: '',
      },
      shares: [],
      disks: [
        { device: '/dev/sda', size: gib(32), emhttpDeviceId: 'boot-disk', interfaceType: 'SATA' },
        { device: '/dev/sdb', size: gib(32), emhttpDeviceId: 'parity-disk', interfaceType: 'SATA' },
      ],
    };

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.get('[data-testid="internal-boot-eligibility-toggle"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('ENABLE_BOOT_TRANSFER_DISABLED');
    expect(wrapper.text()).toContain('ALREADY_INTERNAL_BOOT');
    expect(wrapper.text()).toContain('BOOT_ELIGIBLE_FALSE');
    expect(wrapper.text()).toContain('NO_UNASSIGNED_DISKS');
  });

  it('keeps the blocked headline focused on server state when eligible disks exist', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = {
      array: {
        state: 'STARTED',
        boot: null,
        parities: [],
        disks: [],
        caches: [],
      },
      vars: {
        fsState: 'Started',
        bootEligible: true,
        enableBootTransfer: 'yes',
        reservedNames: '',
      },
      shares: [],
      disks: [
        { device: '/dev/sda', size: gib(32), emhttpDeviceId: 'eligible-disk', interfaceType: 'SATA' },
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
        state: 'STOPPED',
        boot: null,
        parities: [],
        disks: [],
        caches: [{ name: 'cache', device: '/dev/sda' }],
      },
      vars: {
        fsState: 'Stopped',
        bootEligible: true,
        enableBootTransfer: 'yes',
        reservedNames: '',
      },
      shares: [],
      disks: [
        { device: '/dev/sda', size: gib(32), emhttpDeviceId: 'cache-disk', interfaceType: 'SATA' },
        { device: '/dev/sdb', size: gib(6), emhttpDeviceId: 'small-disk', interfaceType: 'SATA' },
        { device: '/dev/sdc', size: gib(32), emhttpDeviceId: 'eligible-disk', interfaceType: 'SATA' },
        { device: '/dev/sdd', size: gib(32), emhttpDeviceId: 'usb-disk', interfaceType: 'USB' },
      ],
    };

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-eligibility-panel"]').exists()).toBe(true);
    const selects = wrapper.findAll('select');
    expect(selects).toHaveLength(3);
    const deviceSelect = selects[1];
    expect(deviceSelect.text()).toContain('eligible-disk');
    expect(deviceSelect.text()).not.toContain('cache-disk');
    expect(deviceSelect.text()).not.toContain('small-disk');
    expect(deviceSelect.text()).not.toContain('usb-disk');
    expect(wrapper.text()).not.toContain('ASSIGNED_TO_CACHE');
    const biosWarning = wrapper.get('[data-testid="internal-boot-update-bios-warning"]');
    const eligibilityPanel = wrapper.get('[data-testid="internal-boot-eligibility-panel"]');
    expect(
      biosWarning.element.compareDocumentPosition(eligibilityPanel.element) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    await wrapper.get('[data-testid="internal-boot-eligibility-toggle"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('ASSIGNED_TO_CACHE');
    expect(wrapper.text()).toContain('USB_TRANSPORT');
    expect(wrapper.text()).toContain('TOO_SMALL');
    expect(wrapper.find('[data-testid="brand-button"]').attributes('disabled')).toBeUndefined();
  });
});
