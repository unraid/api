import { BellAlertIcon } from '@heroicons/vue/24/solid';
import { defineStore, createPinia, setActivePinia } from 'pinia';

import useInstallPlugin from '~/composables/installPlugin';

import { ACCOUNT_CALLBACK, WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';

import { useCallbackStore } from '~/store/callbackActions';
import { useErrorsStore } from '~/store/errors';
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
  const errorsStore = useErrorsStore();
  const serverStore = useServerStore();
  const useUpdateOsStore = useUpdateOsStoreGeneric();
  const updateOsStore = useUpdateOsStore();

  const { install: installPlugin } = useInstallPlugin();

  // State
  const osVersion = computed(() => serverStore.osVersion);
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
        return 'Reboot Required for Update'
      default:
        return '';
    }
  });

  const ineligible = computed(() => !serverStore.guid || !serverStore.keyfile || !osVersion.value || regUpdatesExpired.value);
  const ineligibleText = computed(() => { // translated in components
    if (!serverStore.guid) {
      return 'A valid GUID is required to check for updates.';
    }
    if (!serverStore.keyfile) {
      return 'A valid keyfile is required to check for updates.';
    }
    if (!osVersion.value) {
      return 'A valid OS version is required to check for updates.';
    }
    if (regUpdatesExpired.value) {
      const base = `Your {0} license included one year of free updates at the time of purchase. You are now eligible to extend your license and access the latest OS updates.`;
      const addtlText = `You are still eligible to access OS updates that were published on or before {1}.`;
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
    }
  });

  // Actions
  const initUpdateOsCallback = (includeNextReleases: boolean = false): UserProfileLink => {
    return {
      click: (includeNext: boolean = includeNextReleases) => {
        callbackStore.send(
          ACCOUNT_CALLBACK.toString(),
          [{
            server: {
              ...serverStore.serverAccountPayload,
              /**
               * @todo - for the time being we'll always include next releases
               * Prefer the param in the event for when a user is on stable and wants to see Next releases.
               * Otherwise if the os version is NOT stable, we'll include next releases
               */
              includeNext: true ?? includeNext ?? !updateOsStore.isOsVersionStable,
            },
            type: 'updateOs',
          }],
          serverStore.inIframe,
        );
      },
      emphasize: true,
      external: true,
      icon: BellAlertIcon,
      name: 'updateOs',
      text: 'Unraid OS {0} Update Available',
      textParams: [updateOsStore.available],
    }
  };

  /**
   * @description When receiving the callback the Account update page we'll use the provided releaseMd5 to find the release in the releases cache.
   */
  const confirmUpdateOs = async (release: Release) => {
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
      update: true,
    });
  };

  const rebootServer = async () => {
    // @ts-ignore • global set in the webgui
    document.rebootNow.submit();
  };

  const viewCurrentReleaseNotes = ( modalTitle: string, webguiFilePath?: string | undefined,) => {
    // @ts-ignore – this is a global function provided by the webgui
    if (typeof openChanges === 'function') {
      // @ts-ignore
      openChanges(
        `showchanges ${webguiFilePath ?? '/var/tmp/unRAIDServer.txt'}`,
        modalTitle,
      );
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
    rebootServer,
    setStatus,
    setRebootType,
    viewCurrentReleaseNotes,
  };
});

export const useUpdateOsStore = useUpdateOsStoreGeneric(useUpdateOsActionsStore as unknown as () => UpdateOsActionStore);
