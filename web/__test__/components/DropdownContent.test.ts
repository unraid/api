import { createPinia, setActivePinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ServerStateData, ServerStateDataAction } from '~/types/server';
import type { UserProfileLink } from '~/types/userProfile';
import type { Ref } from 'vue';

import DropdownContent from '~/components/UserProfile/DropdownContent.vue';
import { createTestI18n } from '../utils/i18n';

const { accountStoreMocks, errorsStoreRefs, serverStoreRefs, updateOsStoreRefs } = vi.hoisted(() => ({
  accountStoreMocks: {
    manage: vi.fn(),
    myKeys: vi.fn(),
  },
  errorsStoreRefs: {
    errors: null as Ref<unknown[]> | null,
  },
  serverStoreRefs: {
    connectPluginInstalled: null as Ref<'dynamix.unraid.net.plg' | ''> | null,
    keyActions: null as Ref<ServerStateDataAction[] | undefined> | null,
    rebootType: null as Ref<string> | null,
    registered: null as Ref<boolean> | null,
    regUpdatesExpired: null as Ref<boolean> | null,
    stateData: null as Ref<ServerStateData> | null,
    stateDataError: null as Ref<{ message: string } | undefined> | null,
  },
  updateOsStoreRefs: {
    available: null as Ref<string | null> | null,
    availableWithRenewal: null as Ref<string | null> | null,
  },
}));

vi.mock('~/store/account', () => ({
  useAccountStore: () => accountStoreMocks,
}));

vi.mock('~/store/errors', async () => {
  const { ref } = await import('vue');
  const { defineStore } = await import('pinia');

  errorsStoreRefs.errors = ref([]);

  const useErrorsStore = defineStore('errorsMockForDropdownContent', () => ({
    errors: errorsStoreRefs.errors!,
  }));

  return { useErrorsStore };
});

vi.mock('~/store/updateOs', async () => {
  const { ref } = await import('vue');
  const { defineStore } = await import('pinia');

  updateOsStoreRefs.available = ref(null);
  updateOsStoreRefs.availableWithRenewal = ref(null);

  const useUpdateOsStore = defineStore('updateOsMockForDropdownContent', () => ({
    available: updateOsStoreRefs.available!,
    availableWithRenewal: updateOsStoreRefs.availableWithRenewal!,
    localCheckForUpdate: vi.fn(),
    setModalOpen: vi.fn(),
  }));

  return { useUpdateOsStore };
});

vi.mock('~/store/server', async () => {
  const { ref } = await import('vue');
  const { defineStore } = await import('pinia');

  serverStoreRefs.keyActions = ref([]);
  serverStoreRefs.connectPluginInstalled = ref('dynamix.unraid.net.plg');
  serverStoreRefs.rebootType = ref('');
  serverStoreRefs.registered = ref(false);
  serverStoreRefs.regUpdatesExpired = ref(false);
  serverStoreRefs.stateData = ref({
    actions: [],
    error: false,
    heading: '',
    humanReadable: '',
    message: '',
  });
  serverStoreRefs.stateDataError = ref(undefined);

  const useServerStore = defineStore('serverMockForDropdownContent', () => ({
    keyActions: serverStoreRefs.keyActions!,
    connectPluginInstalled: serverStoreRefs.connectPluginInstalled!,
    rebootType: serverStoreRefs.rebootType!,
    registered: serverStoreRefs.registered!,
    regUpdatesExpired: serverStoreRefs.regUpdatesExpired!,
    stateData: serverStoreRefs.stateData!,
    stateDataError: serverStoreRefs.stateDataError!,
  }));

  return { useServerStore };
});

describe('DropdownContent', () => {
  const isManageLicenseItem = (
    item: unknown
  ): item is UserProfileLink<'manageLicense'> & { name: 'manageLicense' } => {
    return (
      typeof item === 'object' && item !== null && (item as { name?: string }).name === 'manageLicense'
    );
  };

  beforeEach(() => {
    setActivePinia(createPinia());

    serverStoreRefs.keyActions!.value = [];
    serverStoreRefs.connectPluginInstalled!.value = 'dynamix.unraid.net.plg';
    serverStoreRefs.rebootType!.value = '';
    serverStoreRefs.registered!.value = false;
    serverStoreRefs.regUpdatesExpired!.value = false;
    serverStoreRefs.stateData!.value = {
      actions: [{ name: 'signIn', text: 'Sign in to Unraid Connect' }],
      error: false,
      heading: '',
      humanReadable: '',
      message: '',
    };
    serverStoreRefs.stateDataError!.value = undefined;

    errorsStoreRefs.errors!.value = [];
    updateOsStoreRefs.available!.value = null;
    updateOsStoreRefs.availableWithRenewal!.value = null;
  });

  it('does not show manage-license helper text when sign-in is the only action', () => {
    const wrapper = shallowMount(DropdownContent, {
      global: {
        plugins: [createTestI18n()],
      },
    });

    expect(wrapper.text()).toContain('Sign In to your Unraid.net account to get started');
    expect(wrapper.text()).not.toContain(
      'Replace, recover, or link your license on your Unraid Account.'
    );
  });

  it('shows manage-license helper text when key actions are available', () => {
    serverStoreRefs.keyActions!.value = [{ name: 'replace', text: 'Replace Key' }];

    const wrapper = shallowMount(DropdownContent, {
      global: {
        plugins: [createTestI18n()],
      },
    });

    expect(wrapper.text()).toContain('Replace, recover, or link your license on your Unraid Account.');
  });

  it('shows the localized trial helper text when trial start is available', () => {
    serverStoreRefs.keyActions!.value = [{ name: 'trialStart', text: 'Start Trial' }];

    const wrapper = shallowMount(DropdownContent, {
      global: {
        plugins: [createTestI18n()],
      },
    });

    expect(wrapper.text()).toContain('Start your trial from Manage License in your Unraid Account.');
  });

  it('uses the first key action behavior for Manage License', () => {
    const replaceClick = vi.fn();
    serverStoreRefs.registered!.value = true;
    serverStoreRefs.stateData!.value = {
      actions: [],
      error: false,
      heading: '',
      humanReadable: '',
      message: '',
    };
    serverStoreRefs.keyActions!.value = [
      {
        click: replaceClick,
        clickParams: ['foo'],
        disabled: true,
        external: true,
        name: 'replace',
        text: 'Replace Key',
        title: 'Replace',
      },
    ];

    const wrapper = shallowMount(DropdownContent, {
      global: {
        plugins: [createTestI18n()],
      },
    });

    const dropdownItems = wrapper.findAllComponents({ name: 'DropdownItem' });
    const manageItem = dropdownItems
      .map((itemWrapper) => itemWrapper.props('item'))
      .find(isManageLicenseItem);

    expect(manageItem).toBeDefined();
    expect(manageItem?.disabled).toBe(true);
    expect(manageItem?.external).toBe(true);

    manageItem?.click?.(manageItem.clickParams);

    expect(replaceClick).toHaveBeenCalledTimes(1);
    expect(accountStoreMocks.myKeys).not.toHaveBeenCalled();
  });
});
