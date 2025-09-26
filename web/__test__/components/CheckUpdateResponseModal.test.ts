import { nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComposerTranslation } from 'vue-i18n';

import CheckUpdateResponseModal from '~/components/UpdateOs/CheckUpdateResponseModal.vue';

const translate: ComposerTranslation = ((key: string, params?: unknown) => {
  if (Array.isArray(params) && params.length > 0) {
    return params.reduce<string>(
      (result, value, index) => result.replace(`{${index}}`, String(value)),
      key
    );
  }

  if (params && typeof params === 'object') {
    return Object.entries(params as Record<string, unknown>).reduce<string>(
      (result, [placeholder, value]) => result.replace(`{${placeholder}}`, String(value)),
      key
    );
  }

  if (typeof params === 'number') {
    return key.replace('{0}', String(params));
  }

  return key;
}) as ComposerTranslation;

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
  Switch: { name: 'Switch', props: ['modelValue'], template: '<div class="switch" />' },
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
  default: () => ({
    outputDateTimeFormatted: ref('2024-01-01'),
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

const mountModal = () =>
  mount(CheckUpdateResponseModal, {
    props: {
      open: true,
      t: translate,
    },
  });

describe('CheckUpdateResponseModal', () => {
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
    checkForUpdatesLoading.value = true;

    const wrapper = mountModal();

    expect(wrapper.find('.responsive-modal-title').text()).toBe('Checking for OS updates...');
    expect(wrapper.find('.brand-loading').exists()).toBe(true);
    expect(wrapper.find('.ui-button').text()).toBe('More Options');
  });

  it('shows up-to-date messaging when no updates are available', async () => {
    osVersion.value = '6.12.3';
    updateOsNotificationsEnabled.value = false;

    const wrapper = mountModal();
    await nextTick();

    expect(wrapper.find('.responsive-modal-title').text()).toBe('Unraid OS is up-to-date');
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

    const wrapper = mountModal();
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

    const wrapper = mountModal();
    await nextTick();

    const actionButtons = wrapper.findAll('.brand-button');
    const labels = actionButtons.map((button) => button.text());
    expect(labels).toContain('View Changelog');
    expect(labels).toContain('Extend License');

    await actionButtons.find((btn) => btn.text() === 'Extend License')?.trigger('click');
    expect(mockRenew).toHaveBeenCalled();
  });
});
