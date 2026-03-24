import { flushPromises, mount } from '@vue/test-utils';

import { REFRESH_INTERNAL_BOOT_CONTEXT_MUTATION } from '@/components/Onboarding/graphql/refreshInternalBootContext.mutation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GetInternalBootContextQuery } from '~/composables/gql/graphql';

import OnboardingInternalBootStep from '~/components/Onboarding/steps/OnboardingInternalBootStep.vue';
import { DiskInterfaceType, GetInternalBootContextDocument } from '~/composables/gql/graphql';
import { createTestI18n } from '../../utils/i18n';

type MockInternalBootSelection = {
  poolName: string;
  slotCount: number;
  devices: string[];
  bootSizeMiB: number;
  updateBios: boolean;
};

type InternalBootVm = {
  getDeviceSelectItems: (index: number) => Array<{ value: string; label: string; disabled?: boolean }>;
};

const {
  draftStore,
  contextResult,
  contextLoading,
  contextError,
  refetchContextMock,
  refreshContextMutationMock,
  useQueryMock,
  useMutationMock,
} = vi.hoisted(() => {
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
    refetchContextMock: vi.fn().mockResolvedValue(undefined),
    refreshContextMutationMock: vi.fn().mockResolvedValue(undefined),
    useQueryMock: vi.fn(),
    useMutationMock: vi.fn(),
  };
});

vi.mock('@unraid/ui', () => ({
  BrandButton: {
    props: ['text', 'disabled', 'loading'],
    emits: ['click'],
    template:
      '<button data-testid="brand-button" :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
  },
  Accordion: {
    props: ['items', 'type', 'collapsible', 'class'],
    template: `<div data-testid="accordion"><template v-for="item in items" :key="item.value"><slot name="trigger" :item="item" :open="false" /><slot name="content" :item="item" :open="false" /></template></div>`,
  },
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: useMutationMock,
  useQuery: useQueryMock,
}));

useQueryMock.mockImplementation(() => ({
  result: contextResult,
  loading: contextLoading,
  error: contextError,
  refetch: refetchContextMock,
}));

useMutationMock.mockImplementation((document: unknown) => {
  if (document === REFRESH_INTERNAL_BOOT_CONTEXT_MUTATION) {
    return {
      mutate: refreshContextMutationMock,
    };
  }

  return {
    mutate: vi.fn(),
  };
});

vi.mock('@/components/Onboarding/store/onboardingDraft', () => ({
  useOnboardingDraftStore: () => draftStore,
}));

const gib = (value: number) => value * 1024 * 1024 * 1024;

const buildContext = (
  overrides: Partial<GetInternalBootContextQuery['internalBootContext']> = {}
): GetInternalBootContextQuery => ({
  internalBootContext: {
    bootEligible: true,
    bootedFromFlashWithInternalBootSetup: false,
    enableBootTransfer: 'yes',
    reservedNames: [],
    shareNames: [],
    poolNames: [],
    driveWarnings: [],
    assignableDisks: [],
    ...overrides,
  },
});

const mountComponent = () =>
  mount(OnboardingInternalBootStep, {
    props: {
      onComplete: vi.fn(),
      showBack: true,
    },
    global: {
      plugins: [createTestI18n()],
      stubs: {
        UButton: {
          props: ['disabled'],
          emits: ['click'],
          template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
        },
        UAlert: {
          props: ['title', 'description'],
          template:
            '<div><slot name="title" />{{ title }}<slot name="description" />{{ description }}<slot /></div>',
        },
        UCheckbox: {
          props: ['modelValue', 'disabled'],
          emits: ['update:modelValue'],
          template: `
            <input
              type="checkbox"
              :checked="modelValue"
              :disabled="disabled"
              @change="$emit('update:modelValue', $event.target.checked)"
            />
          `,
        },
        UInput: {
          props: ['modelValue', 'type', 'disabled', 'maxlength', 'min', 'max'],
          emits: ['update:modelValue'],
          template: `
            <input
              :type="type || 'text'"
              :disabled="disabled"
              :maxlength="maxlength"
              :min="min"
              :max="max"
              :value="modelValue"
              @input="$emit('update:modelValue', $event.target.value)"
            />
          `,
        },
        USelectMenu: {
          props: ['modelValue', 'items', 'disabled', 'placeholder'],
          emits: ['update:modelValue'],
          template: `
            <select
              data-testid="select"
              :disabled="disabled"
              :value="modelValue ?? ''"
              @change="$emit('update:modelValue', $event.target.value)"
            >
              <option v-if="placeholder" value="">{{ placeholder }}</option>
              <option
                v-for="item in items"
                :key="item.value"
                :value="item.value"
                :disabled="item.disabled"
              >
                {{ item.label }}
              </option>
            </select>
          `,
        },
      },
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
    contextResult.value = buildContext({
      bootEligible: null,
      enableBootTransfer: 'maybe',
      poolNames: ['cache'],
      assignableDisks: [
        {
          id: 'BOOT-1',
          device: '/dev/sda',
          size: gib(32),
          serialNum: 'BOOT-1',
          interfaceType: DiskInterfaceType.SATA,
        },
        {
          id: 'PARITY-1',
          device: '/dev/sdb',
          size: gib(32),
          serialNum: 'PARITY-1',
          interfaceType: DiskInterfaceType.SATA,
        },
        {
          id: 'ARRAY-1',
          device: '/dev/sdc',
          size: gib(32),
          serialNum: 'ARRAY-1',
          interfaceType: DiskInterfaceType.SATA,
        },
        {
          id: 'CACHE-1',
          device: '/dev/sdd',
          size: gib(32),
          serialNum: 'CACHE-1',
          interfaceType: DiskInterfaceType.SATA,
        },
        {
          id: 'SMALL-1',
          device: '/dev/sde',
          size: gib(6),
          serialNum: 'SMALL-1',
          interfaceType: DiskInterfaceType.SATA,
        },
        {
          id: 'USB-1',
          device: '/dev/sdf',
          size: gib(32),
          serialNum: 'USB-1',
          interfaceType: DiskInterfaceType.USB,
        },
      ],
    });

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-eligibility-panel"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="internal-boot-intro-panel"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('No eligible devices were detected for internal boot setup.');
    await wrapper.get('[data-testid="internal-boot-eligibility-toggle"]').trigger('click');
    await flushPromises();
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
    contextResult.value = buildContext({
      assignableDisks: [
        {
          id: 'WD-TEST-1234',
          device: '/dev/sda',
          size: gib(32),
          serialNum: 'WD-TEST-1234',
          interfaceType: DiskInterfaceType.SATA,
        },
      ],
    });

    const wrapper = mountComponent();
    await flushPromises();

    const vm = wrapper.vm as unknown as InternalBootVm;
    expect(vm.getDeviceSelectItems(0)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: 'WD-TEST-1234',
          label: 'WD-TEST-1234 - 34.4 GB (sda)',
        }),
      ])
    );
  });

  it('defaults the storage pool name to cache', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = buildContext({
      assignableDisks: [
        {
          id: 'ELIGIBLE-1',
          device: '/dev/sda',
          size: gib(32),
          serialNum: 'ELIGIBLE-1',
          interfaceType: DiskInterfaceType.SATA,
        },
      ],
    });

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
    contextResult.value = buildContext({
      poolNames: ['cache'],
      assignableDisks: [
        {
          id: 'ELIGIBLE-1',
          device: '/dev/sda',
          size: gib(32),
          serialNum: 'ELIGIBLE-1',
          interfaceType: DiskInterfaceType.SATA,
        },
      ],
    });

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.get('input[type="text"]').element).toHaveProperty('value', '');
  });

  it('shows explicit disabled and empty-disk codes when the system reports them', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = buildContext({
      bootEligible: false,
      enableBootTransfer: 'no',
      assignableDisks: [],
    });

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.get('[data-testid="internal-boot-eligibility-toggle"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('ENABLE_BOOT_TRANSFER_DISABLED');
    expect(wrapper.text()).toContain('BOOT_ELIGIBLE_FALSE');
    expect(wrapper.text()).toContain('NO_UNASSIGNED_DISKS');
  });

  it('shows a drive warning when a selectable disk already has internal boot partitions', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = buildContext({
      driveWarnings: [
        {
          diskId: 'ELIGIBLE-1',
          device: 'sda',
          warnings: ['HAS_INTERNAL_BOOT_PARTITIONS'],
        },
      ],
      assignableDisks: [
        {
          id: 'ELIGIBLE-1',
          device: '/dev/sda',
          size: gib(32),
          serialNum: 'ELIGIBLE-1',
          interfaceType: DiskInterfaceType.SATA,
        },
      ],
    });

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="brand-button"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.find('[data-testid="internal-boot-drive-warning"]').exists()).toBe(false);
    const selects = wrapper.findAll('select');
    await selects[1]?.setValue('ELIGIBLE-1');
    await flushPromises();
    expect(wrapper.find('[data-testid="internal-boot-drive-warning"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Selected drive warnings');
    await wrapper.get('[data-testid="internal-boot-eligibility-toggle"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('HAS_INTERNAL_BOOT_PARTITIONS');
  });

  it('shows disk-level ineligibility while keeping the form available for eligible disks', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = buildContext({
      poolNames: ['cache'],
      assignableDisks: [
        {
          id: 'SMALL-1',
          device: '/dev/sdb',
          size: gib(6),
          serialNum: 'SMALL-1',
          interfaceType: DiskInterfaceType.SATA,
        },
        {
          id: 'ELIGIBLE-1',
          device: '/dev/sdc',
          size: gib(32),
          serialNum: 'ELIGIBLE-1',
          interfaceType: DiskInterfaceType.SATA,
        },
        {
          id: 'USB-1',
          device: '/dev/sdd',
          size: gib(32),
          serialNum: 'USB-1',
          interfaceType: DiskInterfaceType.USB,
        },
      ],
    });

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-eligibility-panel"]').exists()).toBe(true);
    const vm = wrapper.vm as unknown as InternalBootVm;
    const deviceItems = vm.getDeviceSelectItems(0);
    expect(deviceItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'ELIGIBLE-1' }),
        expect.objectContaining({ value: 'USB-1' }),
      ])
    );
    expect(deviceItems).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'SMALL-1' })])
    );
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
    contextResult.value = buildContext({
      assignableDisks: [
        {
          id: 'UNASSIGNED-1',
          device: '/dev/sda',
          size: gib(32),
          serialNum: 'UNASSIGNED-1',
          interfaceType: DiskInterfaceType.SATA,
        },
      ],
    });

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="internal-boot-intro-panel"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="internal-boot-eligibility-panel"]').exists()).toBe(false);
    const vm = wrapper.vm as unknown as InternalBootVm;
    expect(vm.getDeviceSelectItems(0)).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'UNASSIGNED-1' })])
    );
    expect(wrapper.text()).not.toContain('ASSIGNED_TO_ARRAY');
    expect(wrapper.text()).not.toContain('NO_UNASSIGNED_DISKS');
    expect(wrapper.find('[data-testid="brand-button"]').attributes('disabled')).toBeUndefined();
  });

  it('refreshes internal boot context on demand', async () => {
    draftStore.bootMode = 'storage';
    contextResult.value = buildContext({
      assignableDisks: [
        {
          id: 'UNASSIGNED-1',
          device: '/dev/sda',
          size: gib(32),
          serialNum: 'UNASSIGNED-1',
          interfaceType: DiskInterfaceType.SATA,
        },
      ],
    });

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.get('[data-testid="internal-boot-refresh-button"]').trigger('click');
    await flushPromises();

    expect(refreshContextMutationMock).toHaveBeenCalledTimes(1);
    expect(refetchContextMock).toHaveBeenCalledTimes(1);
  });
});
