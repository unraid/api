import { nextTick, ref } from 'vue';
import { enableAutoUnmount, mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CheckUpdateResponseModal from '~/components/UpdateOs/CheckUpdateResponseModal.vue';
import { createTestI18n, testTranslate } from '../utils/i18n';

enableAutoUnmount(afterEach);

vi.mock('@unraid/ui', () => ({
  BrandButton: {
    name: 'BrandButton',
    props: {
      text: {
        type: String,
        default: undefined,
      },
    },
    emits: ['click'],
    template: '<button class="brand-button" @click="$emit(\'click\')"><slot>{{ text }}</slot></button>',
  },
  CardWrapper: { template: '<section class="card-wrapper"><slot /></section>' },
  BrandLoading: { template: '<div class="brand-loading" />' },
  Button: { template: '<button class="ui-button"><slot /></button>' },
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
  DialogDescription: { template: '<div class="dialog-description"><slot /></div>' },
  Label: { template: '<label><slot /></label>' },
  ResponsiveModal: {
    name: 'ResponsiveModal',
    props: ['open', 'dialogClass', 'sheetClass', 'showCloseButton'],
    template: '<div class="responsive-modal"><slot /></div>',
  },
  ResponsiveModalFooter: { template: '<div class="responsive-modal-footer"><slot /></div>' },
  ResponsiveModalHeader: { template: '<div class="responsive-modal-header"><slot /></div>' },
  ResponsiveModalTitle: { template: '<div class="responsive-modal-title"><slot /></div>' },
  Switch: {
    name: 'Switch',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<button role="switch" :aria-checked="modelValue" @click="$emit(\'update:modelValue\', !modelValue)" />',
  },
  Tooltip: { template: '<div class="tooltip"><slot /></div>' },
  TooltipTrigger: { template: '<div class="tooltip-trigger"><slot /></div>' },
  TooltipContent: { template: '<div class="tooltip-content"><slot /></div>' },
  TooltipProvider: { template: '<div class="tooltip-provider"><slot /></div>' },
}));

vi.mock('@heroicons/vue/24/solid', () => ({
  ArrowTopRightOnSquareIcon: { template: '<svg />' },
  CheckCircleIcon: { template: '<svg />' },
  CogIcon: { template: '<svg />' },
  EyeIcon: { template: '<svg />' },
  IdentificationIcon: { template: '<svg />' },
  KeyIcon: { template: '<svg />' },
}));

vi.mock('@heroicons/vue/24/outline', () => ({
  ArrowDownTrayIcon: { template: '<svg />' },
}));

vi.mock('~/components/UpdateOs/IgnoredRelease.vue', () => ({
  default: { template: '<div class="ignored-release" />', props: ['label'] },
}));

vi.mock('~/composables/dateTime', () => ({
  default: (_format: unknown, _t: unknown, _local: boolean, timestamp: number) => ({
    outputDateTimeFormatted: ref(new Date(timestamp * 1000).toISOString().slice(0, 10)),
    outputDateTimeReadableDiff: ref('today'),
  }),
}));

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');

  const isActualStore = (candidate: unknown): candidate is Parameters<typeof actual.storeToRefs>[0] =>
    Boolean(candidate && typeof candidate === 'object' && '$id' in candidate);

  const isRefLike = (input: unknown): input is { value: unknown } =>
    Boolean(input && typeof input === 'object' && 'value' in input);

  return {
    ...actual,
    storeToRefs: (store: unknown) => {
      if (isActualStore(store)) {
        return actual.storeToRefs(store);
      }

      if (!store || typeof store !== 'object') {
        return {};
      }

      const refs: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(store)) {
        if (isRefLike(value)) {
          refs[key] = value;
        }
      }

      return refs;
    },
  };
});

const mockAccountUpdateOs = vi.fn();
vi.mock('~/store/account', () => ({
  useAccountStore: () => ({
    updateOs: mockAccountUpdateOs,
  }),
}));

const mockRenew = vi.fn();
vi.mock('~/store/purchase', () => ({
  usePurchaseStore: () => ({
    renew: mockRenew,
  }),
}));

const mockSetReleaseForUpdate = vi.fn();
const mockSetModalOpen = vi.fn();
const mockFetchAndConfirmInstall = vi.fn();

const available = ref<string | null>(null);
const availableWithRenewal = ref<string | null>(null);
const availableReleaseDate = ref<number | null>(null);
const availableRequiresAuth = ref(false);
const checkForUpdatesLoading = ref(false);

vi.mock('~/store/updateOs', () => ({
  useUpdateOsStore: () => ({
    available,
    availableWithRenewal,
    availableReleaseDate,
    availableRequiresAuth,
    checkForUpdatesLoading,
    setReleaseForUpdate: mockSetReleaseForUpdate,
    setModalOpen: mockSetModalOpen,
    fetchAndConfirmInstall: mockFetchAndConfirmInstall,
  }),
}));

const regExp = ref<number | null>(null);
const regUpdatesExpired = ref(false);
const dateTimeFormat = ref('YYYY-MM-DD');
const osVersion = ref<string | null>(null);
const updateOsIgnoredReleases = ref<string[]>([]);
const updateOsNotificationsEnabled = ref(true);
const updateOsResponse = ref<{ changelog?: string | null } | null>(null);

const mockUpdateOsIgnoreRelease = vi.fn();

vi.mock('~/store/server', () => ({
  useServerStore: () => ({
    regExp,
    regUpdatesExpired,
    dateTimeFormat,
    osVersion,
    updateOsIgnoredReleases,
    updateOsNotificationsEnabled,
    updateOsResponse,
    updateOsIgnoreRelease: mockUpdateOsIgnoreRelease,
  }),
}));

const mountModal = (embedded = false, open = true) =>
  mount(CheckUpdateResponseModal, {
    props: {
      open,
      embedded,
    },
    global: {
      plugins: [createTestI18n()],
    },
  });

describe.each([false, true])('CheckUpdateResponseModal (embedded=%s)', (embedded) => {
  const renderModal = () => mountModal(embedded);
  const titleSelector = embedded ? 'h2' : '.responsive-modal-title';

  afterEach(() => {
    vi.useRealTimers();
  });
  beforeEach(() => {
    available.value = null;
    availableWithRenewal.value = null;
    availableReleaseDate.value = null;
    availableRequiresAuth.value = false;
    checkForUpdatesLoading.value = false;
    regExp.value = null;
    regUpdatesExpired.value = false;
    osVersion.value = null;
    updateOsIgnoredReleases.value = [];
    updateOsNotificationsEnabled.value = true;
    updateOsResponse.value = null;

    mockAccountUpdateOs.mockClear();
    mockRenew.mockClear();
    mockSetModalOpen.mockClear();
    mockSetReleaseForUpdate.mockClear();
    mockFetchAndConfirmInstall.mockClear();
    mockUpdateOsIgnoreRelease.mockClear();
  });

  it('renders loading state while checking for updates', () => {
    expect(testTranslate('updateOs.checkUpdateResponseModal.checkingForOsUpdates')).toBe(
      'Checking for OS updates...'
    );
    checkForUpdatesLoading.value = true;

    const wrapper = renderModal();

    expect(wrapper.find(titleSelector).text()).toBe('Checking for OS updates...');
    expect(wrapper.find('.brand-loading').exists()).toBe(true);
    expect(wrapper.find('.ui-button').text()).toBe('More Options');
  });

  it('shows up-to-date messaging when no updates are available', async () => {
    osVersion.value = '6.12.3';
    updateOsNotificationsEnabled.value = false;

    const wrapper = renderModal();
    await nextTick();

    expect(wrapper.find(titleSelector).text()).toBe('Unraid OS is up-to-date');
    expect(wrapper.text()).toContain('Current Version 6.12.3');
    expect(wrapper.text()).toContain(
      'Go to Settings > Notifications to enable automatic OS update notifications for future releases.'
    );

    expect(wrapper.find('.ui-button').text()).toBe('More Options');
    expect(wrapper.text()).toContain('Enable update notifications');
  });

  it('displays update actions when a new release is available', async () => {
    available.value = '6.13.0';
    osVersion.value = '6.12.3';
    updateOsResponse.value = { changelog: '### New release' };

    const wrapper = renderModal();
    await nextTick();

    const actionButtons = wrapper.findAll('.brand-button');
    const viewChangelogButton = actionButtons.find((button) =>
      button.text().includes('View Changelog to Start Update')
    );
    expect(viewChangelogButton).toBeDefined();

    await viewChangelogButton!.trigger('click');
    expect(mockSetReleaseForUpdate).toHaveBeenCalledWith({ changelog: '### New release' });
  });

  it('includes renew option when update requires license renewal', async () => {
    available.value = '6.14.0';
    availableWithRenewal.value = '6.14.0';
    updateOsResponse.value = { changelog: '### Renewal release' };

    const wrapper = renderModal();
    await nextTick();

    const actionButtons = wrapper.findAll('.brand-button');
    const labels = actionButtons.map((button) => button.text());
    expect(labels).toContain('View Changelog');
    expect(labels).toContain('Extend License');

    await actionButtons.find((btn) => btn.text() === 'Extend License')?.trigger('click');
    expect(mockRenew).toHaveBeenCalled();
  });

  it('keeps the selected container and content hidden when closed', () => {
    const wrapper = mountModal(embedded, false);
    if (embedded) {
      expect(wrapper.find('.card-wrapper').exists()).toBe(false);
      expect(wrapper.find('.responsive-modal').exists()).toBe(false);
    } else {
      expect(wrapper.findComponent({ name: 'ResponsiveModal' }).props('open')).toBe(false);
    }
  });

  it('routes verification and more options through the account updater', async () => {
    available.value = '7.3.0-beta.1';
    availableRequiresAuth.value = true;
    const wrapper = renderModal();
    expect(wrapper.text()).toContain('7.3.0-beta.1');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Verify to Update')!
      .trigger('click');
    expect(mockAccountUpdateOs).toHaveBeenCalledTimes(1);
    expect(mockSetReleaseForUpdate).not.toHaveBeenCalled();
    await wrapper.find('.ui-button').trigger('click');
    expect(mockAccountUpdateOs).toHaveBeenCalledTimes(2);
  });

  it('shows the release date and updates it after a new check', async () => {
    available.value = '7.3.0';
    availableReleaseDate.value = 1704067200;
    const wrapper = renderModal();
    expect(wrapper.text()).toContain('Released on 2024-01-01');
    availableReleaseDate.value = 1704153600;
    await nextTick();
    expect(wrapper.text()).toContain('Released on 2024-01-02');
  });

  it.each([false, true])('shows license eligibility when expired=%s', async (expired) => {
    availableWithRenewal.value = '7.3.0';
    regUpdatesExpired.value = expired;
    regExp.value = 1704067200;
    const wrapper = renderModal();
    expect(wrapper.text()).toContain('2024-01-01');
    regExp.value = 1704153600;
    await nextTick();
    expect(wrapper.text()).toContain('2024-01-02');
    expect(wrapper.text()).toContain('Extend License');
  });

  it('shows ignored releases and the notifications settings link', () => {
    updateOsIgnoredReleases.value = ['7.2.0', '7.2.1'];
    updateOsNotificationsEnabled.value = false;
    const wrapper = renderModal();
    expect(wrapper.findAll('.ignored-release')).toHaveLength(2);
    expect(wrapper.text()).toContain('Ignored Releases');
    expect(wrapper.find('[href="/Settings/Notifications"]').exists()).toBe(true);
  });

  it.each(['available', 'renewal'])(
    'explains ignore and ignores the %s release only after close',
    async (kind) => {
      vi.useFakeTimers();
      if (kind === 'renewal') availableWithRenewal.value = '7.3.0';
      else available.value = '7.3.0';
      const wrapper = renderModal();
      await wrapper.find('[role="switch"]').trigger('click');
      const tooltip = wrapper.findAll('.tooltip').find((item) => item.text().includes('Close'))!;
      expect(tooltip.find('.tooltip-content').text()).toBe(
        testTranslate('updateOs.checkUpdateResponseModal.youCanOptBackInTo')
      );
      expect(mockUpdateOsIgnoreRelease).not.toHaveBeenCalled();
      await tooltip.find('button').trigger('click');
      expect(mockSetModalOpen).toHaveBeenCalledWith(false);
      expect(mockUpdateOsIgnoreRelease).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(500);
      expect(mockUpdateOsIgnoreRelease).toHaveBeenCalledWith('7.3.0');
    }
  );

  it('restores update actions when ignored releases are cleared', async () => {
    available.value = '7.3.0';
    updateOsResponse.value = { changelog: 'release' };
    updateOsIgnoredReleases.value = ['7.2.0'];
    const wrapper = renderModal();
    await wrapper.find('[role="switch"]').trigger('click');
    expect(wrapper.text()).toContain('Close');
    updateOsIgnoredReleases.value = [];
    await nextTick();
    expect(wrapper.find('[role="switch"]').attributes('aria-checked')).toBe('false');
    expect(wrapper.text()).toContain('View Changelog to Start Update');
  });
});
