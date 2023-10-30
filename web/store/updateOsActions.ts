import { ArrowPathIcon, BellAlertIcon } from '@heroicons/vue/24/solid';
import { defineStore, createPinia, setActivePinia } from 'pinia';

import useInstallPlugin from '~/composables/installPlugin';
import { getOsReleaseBySha256 } from '~/composables/services/keyServer';

import { ACCOUNT_CALLBACK, WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';

import { useCallbackStore } from '~/store/callbackActions';
// import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import {
  useUpdateOsStoreGeneric,
  type Release,
  type UpdateOsActionStore,
} from '~/store/updateOs';

import type { UserProfileLink } from '~/types/userProfile';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useUpdateOsActionsStore = defineStore('updateOsActions', () => {
  const callbackStore = useCallbackStore();
  // const errorsStore = useErrorsStore();
  const serverStore = useServerStore();
  const useUpdateOsStore = useUpdateOsStoreGeneric();
  const updateOsStore = useUpdateOsStore();

  const { install: installPlugin } = useInstallPlugin();

  // State
  const osVersion = computed(() => serverStore.osVersion);
  const osVersionBranch = computed(() => serverStore.osVersionBranch);
  const regExp = computed(() => serverStore.regExp);
  const regUpdatesExpired = computed(() => serverStore.regUpdatesExpired);
  /** used when coming back from callback, this will be the release to install */
  const status = ref<'confirming' | 'checking' | 'ineligible' | 'failed' | 'ready' | 'success' | 'updating' | 'downgrading'>('ready');
  const callbackUpdateRelease = ref<Release | null>(null);
  const rebootType = ref<'thirdPartyDriversDownloading' | 'downgrade' | 'upgrade' | ''>('');
  const rebootTypeText = computed(() => {
    /** translations are handled by rendering template's `t()` */
    switch (rebootType.value) {
      case 'thirdPartyDriversDownloading':
        return 'Updating 3rd party drivers';
      case 'downgrade':
        return 'Reboot Required for Downgrade';
      case 'upgrade':
        return 'Reboot Required for Update';
      default:
        return '';
    }
  });

  const ineligible = computed(() => !serverStore.guid || !serverStore.keyfile || !osVersion.value || regUpdatesExpired.value);
  const ineligibleText = computed(() => { // translated in components
    if (!serverStore.guid) {
      return 'A valid GUID is required to check for OS updates.';
    }
    if (!serverStore.keyfile) {
      return 'A valid keyfile is required to check for OS updates.';
    }
    if (!osVersion.value) {
      return 'A valid OS version is required to check for OS updates.';
    }
    if (regUpdatesExpired.value) {
      const base = 'Your {0} license included one year of free updates at the time of purchase. You are now eligible to extend your license and access the latest OS updates.';
      const addtlText = 'You are still eligible to access OS updates that were published on or before {1}.';
      return updateOsStore.available ? `${base} ${addtlText}` : base;
    }
    return '';
  });

  const toolsRegistrationAction = computed(() => {
    return {
      href: WEBGUI_TOOLS_UPDATE.toString(),
      emphasize: true,
      icon: BellAlertIcon,
      name: 'updateOs',
      text: 'Unraid OS {0} Update Available',
      textParams: [updateOsStore.available],
    };
  });

  // Actions
  const initUpdateOsCallback = (): UserProfileLink => {
    return {
      click: () => {
        callbackStore.send(
          ACCOUNT_CALLBACK.toString(),
          [{
            server: {
              ...serverStore.serverAccountPayload,
            },
            type: 'updateOs',
          }],
          serverStore.inIframe,
        );
      },
      external: updateOsStore.available,
      icon: updateOsStore.available ? BellAlertIcon : ArrowPathIcon,
      name: 'updateOs',
      text: updateOsStore.available ? 'Unraid OS {0} Update Available' : 'Check for OS Updates',
      textParams: [updateOsStore.available],
    };
  };

  const executeUpdateOsCallback = async () => {
    await callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverAccountPayload,
        },
        type: 'updateOs',
      }],
      serverStore.inIframe,
    );
  };

  /**
   * @description When receiving the callback the Account update page we'll use the provided sha256 of the release to get the release from the keyserver
   */
  const getReleaseFromKeyServer = async (sha256: string): Release => {
    console.debug('[getReleaseFromKeyServer]', sha256);
    try {
      const response = await getOsReleaseBySha256(sha256);
      console.debug('[getReleaseFromKeyServer]', response);
      return response;
    } catch (error) {
      console.error(error);
      throw new Error('Unable to get release from keyserver');
    }
  };

  const confirmUpdateOs = (release: Release) => {
    callbackUpdateRelease.value = release;
    setStatus('confirming');
  };

  const installOsUpdate = () => {
    if (!callbackUpdateRelease.value) {
      return console.error('[installOsUpdate] release not found');
    }

    setStatus('updating');
    installPlugin({
      modalTitle: `${callbackUpdateRelease.value.name} Update`,
      pluginUrl: callbackUpdateRelease.value.plugin_url,
      update: false,
    });
  };

  const rebootServer = () => {
    // @ts-ignore • global set in the webgui
    document.rebootNow.submit();
  };

  const viewCurrentReleaseNotes = (modalTitle:string, webguiFilePath?:string|undefined) => {
    if (typeof openChanges === 'function') { // @ts-ignore
      openChanges(`showchanges ${webguiFilePath ?? '/var/tmp/unRAIDServer.txt'}`, modalTitle);
    } else {
      alert('Unable to open release notes');
    }
  };

  const setStatus = (payload: typeof status.value) => {
    status.value = payload;
  };

  const setRebootType = (payload: typeof rebootType.value) => {
    rebootType.value = payload;
  };

  watchEffect(() => {
    if (status.value === 'ready' && ineligible.value) {
      setStatus('ineligible');
    }
  });

  return {
    // State
    callbackUpdateRelease,
    osVersion,
    osVersionBranch,
    regExp,
    regUpdatesExpired,
    rebootType,
    rebootTypeText,
    status,
    ineligible,
    ineligibleText,
    toolsRegistrationAction,
    // Actions
    confirmUpdateOs,
    installOsUpdate,
    initUpdateOsCallback,
    executeUpdateOsCallback,
    rebootServer,
    setStatus,
    setRebootType,
    viewCurrentReleaseNotes,
    getReleaseFromKeyServer,
  };
});

export const useUpdateOsStore = useUpdateOsStoreGeneric({
  useUpdateOsActions: useUpdateOsActionsStore as unknown as () => UpdateOsActionStore,
});
