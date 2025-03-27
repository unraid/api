import { ArrowPathIcon, BellAlertIcon } from '@heroicons/vue/24/solid';
import { defineStore, createPinia, setActivePinia } from 'pinia';

import useInstallPlugin from '~/composables/installPlugin';
import { getOsReleaseBySha256, type GetOsReleaseBySha256Payload } from '~/composables/services/releases';

import { WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';

import { useAccountStore } from '~/store/account';
// import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';

import type { ExternalUpdateOsAction } from '@unraid/shared-callbacks';
import type { UserProfileLink } from '~/types/userProfile';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export interface Release {
  version: string; // "6.12.4"
  name: string; // "Unraid 6.12.4"
  basefile: string; // "unRAIDServer-6.12.4-x86_64.zip"
  date: string; // "2023-08-31"
  url: string; // "https://stable.dl.unraid.net/unRAIDServer-6.12.4-x86_64.zip"
  changelog: string; // "https://raw.githubusercontent.com/unraid/docs/main/docs/unraid-os/release-notes/6.12.4.md"
  changelogPretty: string; // "https://docs.unraid.net/unraid-os/release-notes/6.12.4/"
  md5: string; // "df6e5859d28c14617efde36d59458206"
  size: string; // "439999418"
  sha256: string; // "5ad2d22e8c124e3b925c3bd05f1d782d8521965aabcbedd7dd782db76afd9ace"
  plugin_url: string; // "https://stable.dl.unraid.net/unRAIDServer-6.12.4.plg"
  plugin_sha256: string; // "57d2ab6036e663208b3f72298ceb478b937b17e333986e68dcae2696c88ed152"
  announce_url: string; // "https://unraid.net/blog/6-12-4"
}

export const useUpdateOsActionsStore = defineStore('updateOsActions', () => {
  const accountStore = useAccountStore();
  // const errorsStore = useErrorsStore();
  const serverStore = useServerStore();
  // in this instance we don't need to pass a payload because we're already in the store that would be passed to it
  const updateOsStore = useUpdateOsStore();

  const { install: installPlugin } = useInstallPlugin();

  // State
  const updateAction = ref<ExternalUpdateOsAction | undefined>();

  const guid = computed(() => serverStore.guid);
  const keyfile = computed(() => serverStore.keyfile);
  const osVersion = computed(() => serverStore.osVersion);
  const osVersionBranch = computed(() => serverStore.osVersionBranch);
  const regUpdatesExpired = computed(() => serverStore.regUpdatesExpired);

  const updateOsAvailable = computed(() => updateOsStore.available);
  /** used when coming back from callback, this will be the release to install */
  const status = ref<'confirming' | 'checking' | 'ineligible' | 'failed' | 'ready' | 'success' | 'updating' | 'downgrading'>('ready');
  const callbackTypeDowngrade = ref<boolean>(false);
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

  const ineligible = computed(() => !guid.value || !keyfile.value || !osVersion.value || regUpdatesExpired.value);
  const ineligibleText = computed(() => { // translated in components
    if (!guid.value) {
      return 'A valid GUID is required to check for OS updates.';
    }
    if (!keyfile.value) {
      return 'A valid keyfile is required to check for OS updates.';
    }
    if (!osVersion.value) {
      return 'A valid OS version is required to check for OS updates.';
    }
    if (regUpdatesExpired.value) {
      const base = 'Your {0} license included one year of free updates at the time of purchase. You are now eligible to extend your license and access the latest OS updates.';
      const addtlText = 'You are still eligible to access OS updates that were published on or before {1}.';
      return updateOsAvailable.value ? `${base} ${addtlText}` : base;
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
      textParams: [updateOsAvailable.value],
    };
  });

  // Actions

  const updateCallbackButton = (): UserProfileLink => {
    return {
      click: () => {
        accountStore.updateOs();
      },
      disabled: rebootType.value !== '',
      external: true,
      icon: updateOsAvailable.value ? BellAlertIcon : ArrowPathIcon,
      name: 'updateOs',
      text: updateOsAvailable.value ? 'Unraid OS {0} Update Available' : 'View Available Updates',
      textParams: [updateOsAvailable.value ?? ''],
      title: rebootType.value !== '' ? rebootTypeText.value : '',
    };
  };

  const setUpdateOsAction = (payload: ExternalUpdateOsAction | undefined) => (updateAction.value = payload);
  /**
   * @description When receiving the callback the Account update page we'll use the provided sha256 of the release to get the release from the keyserver
   */
  const getReleaseFromKeyServer = async (payload: GetOsReleaseBySha256Payload) => {
    console.debug('[getReleaseFromKeyServer]', payload);
    if (!payload.keyfile) {
      throw new Error('No payload.keyfile provided');
    }
    if (!payload.sha256) {
      throw new Error('No payload.sha256 provided');
    }
    try {
      /**
       * @todo correctly handle an error and show message to try again
       */
      const response = await getOsReleaseBySha256(payload);
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

  const actOnUpdateOsAction = async (downgrade: boolean = false) => {
    const foundRelease = await getReleaseFromKeyServer({
      keyfile: keyfile.value,
      sha256: updateAction.value?.sha256 ?? '',
    });
    if (downgrade) {
      callbackTypeDowngrade.value = true;
    }
    console.debug('[redirectToCallbackType] updateOs foundRelease', foundRelease);
    if (!foundRelease) {
      throw new Error('Release not found');
    }
    if (foundRelease.version === osVersion.value) {
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
      modalTitle: callbackTypeDowngrade.value ? `${callbackUpdateRelease.value.name} Downgrade` : `${callbackUpdateRelease.value.name} Update`,
      pluginUrl: callbackUpdateRelease.value.plugin_url,
      update: false,
    });
  };

  const rebootServer = () => {
    // @ts-expect-error • global set in the webgui
    document.rebootNow.submit();
  };
  /**
   * By default this will display current version's release notes
   */
  const viewReleaseNotes = (modalTitle:string, webguiFilePath?:string|undefined) => {
    // @ts-expect-error • global set in the webgui
    if (typeof openChanges === 'function') {
      // @ts-expect-error • global set in the webgui
      openChanges(`showchanges ${webguiFilePath ?? '/var/tmp/unRAIDServer.txt'}`, modalTitle);
      // @ts-expect-error • global set in the webgui
    } else if (typeof openBox === 'function') {
      // @ts-expect-error • global set in the webgui
      openBox(`/plugins/dynamix.plugin.manager/include/ShowChanges.php?file=${webguiFilePath ?? '/var/tmp/unRAIDServer.txt'}`, modalTitle, 600, 900);
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
    callbackTypeDowngrade,
    callbackUpdateRelease,
    osVersion,
    osVersionBranch,
    rebootType,
    rebootTypeText,
    status,
    ineligible,
    ineligibleText,
    toolsRegistrationAction,
    // Actions
    actOnUpdateOsAction,
    confirmUpdateOs,
    installOsUpdate,
    updateCallbackButton,
    rebootServer,
    setStatus,
    setUpdateOsAction,
    viewReleaseNotes,
    getReleaseFromKeyServer,
  };
});
