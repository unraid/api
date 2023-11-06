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

import type { ExternalUpdateOsAction } from '~/store/callback';
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
  // in this instance we don't need to pass a payload because we're already in the store that would be passed to it
  const useUpdateOsStore = useUpdateOsStoreGeneric();
  const updateOsStore = useUpdateOsStore();

  const { install: installPlugin } = useInstallPlugin();

  // State
  const updateAction = ref<ExternalUpdateOsAction | undefined>();
  const osVersion = computed(() => serverStore.osVersion);
  const osVersionBranch = computed(() => serverStore.osVersionBranch);
  const regExp = computed(() => serverStore.regExp);
  const regUpdatesExpired = computed(() => serverStore.regUpdatesExpired);
  /** used when coming back from callback, this will be the release to install */
  const status = ref<'confirming' | 'checking' | 'ineligible' | 'failed' | 'ready' | 'success' | 'updating' | 'downgrading'>('ready');
  const callbackUpdateRelease = ref<Release | null>(null);
  const rebootType = computed(() => serverStore.rebootType);
  const rebootTypeText = computed(() => {
    /** translations are handled by rendering template's `t()` */
    switch (rebootType.value) {
      case 'thirdPartyDriversDownloading':
        return 'Updating 3rd party drivers';
      case 'downgrade':
        return 'Reboot Required for Downgrade';
      case 'update':
        return 'Reboot Required for Update';
      default:
        return '';
    }
  });
  const rebootVersion = computed(() => serverStore.rebootVersion);

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
          serverStore.inIframe ? 'newTab' : undefined,
        );
      },
      external: true,
      icon: updateOsStore.available ? BellAlertIcon : ArrowPathIcon,
      name: 'updateOs',
      text: updateOsStore.available ? 'Unraid OS {0} Update Available' : 'Check for OS Updates',
      textParams: [updateOsStore.available],
    };
  };

  const executeUpdateOsCallback = async (autoRedirectReplace?: boolean) => {
    await callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      [{
        server: {
          ...serverStore.serverAccountPayload,
        },
        type: 'updateOs',
      }],
      serverStore.inIframe ? 'newTab' : (autoRedirectReplace ? 'replace' : undefined),
    );
  };

  const setUpdateOsAction = (payload: ExternalUpdateOsAction | undefined) => (updateAction.value = payload);
  /**
   * @description When receiving the callback the Account update page we'll use the provided sha256 of the release to get the release from the keyserver
   */
  const getReleaseFromKeyServer = async (sha256: string) => {
    console.debug('[getReleaseFromKeyServer]', sha256);
    if (!sha256) {
      throw new Error('No sha256 provided');
    }
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

  const actOnUpdateOsAction = async () => {
    const foundRelease = await getReleaseFromKeyServer(updateAction.value?.sha256 ?? '');
    console.debug('[redirectToCallbackType] updateOs foundRelease', foundRelease);
    if (!foundRelease) {
      throw new Error('Release not found');
    }
    if (foundRelease.version === serverStore.osVersion) {
      throw new Error('Release version is the same as the server\'s current version');
    }
    confirmUpdateOs(foundRelease);
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
  /**
   * By default this will display current version's release notes
   */
  const viewReleaseNotes = (modalTitle:string, webguiFilePath?:string|undefined) => { // @ts-ignore
    if (typeof openChanges === 'function') { // @ts-ignore
      openChanges(`showchanges ${webguiFilePath ?? '/var/tmp/unRAIDServer.txt'}`, modalTitle);
    } else {
      alert('Unable to open release notes');
    }
  };

  const setStatus = (payload: typeof status.value) => {
    status.value = payload;
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
    rebootVersion,
    status,
    ineligible,
    ineligibleText,
    toolsRegistrationAction,
    // Actions
    actOnUpdateOsAction,
    confirmUpdateOs,
    installOsUpdate,
    initUpdateOsCallback,
    executeUpdateOsCallback,
    rebootServer,
    setStatus,
    setUpdateOsAction,
    viewReleaseNotes,
    getReleaseFromKeyServer,
  };
});

export const useUpdateOsStore = useUpdateOsStoreGeneric({
  useUpdateOsActions: useUpdateOsActionsStore as unknown as () => UpdateOsActionStore,
});
