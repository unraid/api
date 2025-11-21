import { computed, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { defineStore } from 'pinia';

import { ArrowPathIcon, BellAlertIcon } from '@heroicons/vue/24/solid';
import { WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';

import type { ExternalUpdateOsAction } from '@unraid/shared-callbacks';
import type { GetOsReleaseBySha256Payload } from '~/composables/services/releases';
import type { UserProfileLink } from '~/types/userProfile';

import useInstallPlugin from '~/composables/installPlugin';
import { getOsReleaseBySha256 } from '~/composables/services/releases';
import { useAccountStore } from '~/store/account';
// import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';

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
  const { t } = useI18n();
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
  const regTy = computed(() => serverStore.regTy);
  const locale = computed(() => serverStore.locale);

  const updateOsAvailable = computed(() => updateOsStore.available);
  const availableWithRenewalRelease = computed(() =>
    updateOsStore.availableWithRenewal ? serverStore.updateOsResponse : undefined
  );
  /** used when coming back from callback, this will be the release to install */
  const status = ref<
    | 'confirming'
    | 'checking'
    | 'ineligible'
    | 'failed'
    | 'ready'
    | 'success'
    | 'updating'
    | 'downgrading'
  >('ready');
  const callbackTypeDowngrade = ref<boolean>(false);
  const callbackUpdateRelease = ref<Release | null>(null);
  const rebootType = computed(() => serverStore.rebootType);
  const rebootTypeText = computed(() => {
    switch (rebootType.value) {
      case 'thirdPartyDriversDownloading':
        return t('updateOs.reboot.thirdPartyDriversDownloading');
      case 'downgrade':
        return t('updateOs.reboot.downgrade');
      case 'update':
        return t('updateOs.reboot.update');
      default:
        return '';
    }
  });

  const ineligible = computed(
    () => !guid.value || !keyfile.value || !osVersion.value || regUpdatesExpired.value
  );
  const formattedReleaseDate = computed(() => {
    if (!availableWithRenewalRelease.value?.date) return '';
    const dateStr = availableWithRenewalRelease.value.date;
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const userLocale = locale.value?.replace('_', '-') || navigator.language || 'en-US';
    return new Intl.DateTimeFormat(userLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  });

  const ineligibleText = computed(() => {
    if (!guid.value) {
      return t('updateOs.ineligible.guidRequired');
    }
    if (!keyfile.value) {
      return t('updateOs.ineligible.keyfileRequired');
    }
    if (!osVersion.value) {
      return t('updateOs.ineligible.osVersionRequired');
    }
    if (regUpdatesExpired.value) {
      if (updateOsAvailable.value) {
        return t('updateOs.ineligible.updatesExpiredWithAvailable', [
          regTy.value,
          formattedReleaseDate.value,
        ]);
      }
      return t('updateOs.ineligible.updatesExpired', [regTy.value]);
    }
    return '';
  });

  const toolsRegistrationAction = computed(() => {
    return {
      href: WEBGUI_TOOLS_UPDATE,
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

  const setUpdateOsAction = (payload: ExternalUpdateOsAction | undefined) =>
    (updateAction.value = payload);
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
      throw new Error("Release version is the same as the server's current version");
    }
    confirmUpdateOs(foundRelease);
  };

  const installOsUpdate = () => {
    if (!callbackUpdateRelease.value) {
      return console.error('[installOsUpdate] release not found');
    }

    setStatus('updating');
    installPlugin({
      modalTitle: callbackTypeDowngrade.value
        ? `${callbackUpdateRelease.value.name} Downgrade`
        : `${callbackUpdateRelease.value.name} Update`,
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
  const viewReleaseNotes = (modalTitle: string, webguiFilePath?: string | undefined) => {
    // @ts-expect-error • global set in the webgui
    if (typeof openChanges === 'function') {
      // @ts-expect-error • global set in the webgui
      openChanges(`showchanges ${webguiFilePath ?? '/var/tmp/unRAIDServer.txt'}`, modalTitle);
      // @ts-expect-error • global set in the webgui
    } else if (typeof openBox === 'function') {
      // @ts-expect-error • global set in the webgui
      openBox(
        `/plugins/dynamix.plugin.manager/include/ShowChanges.php?file=${webguiFilePath ?? '/var/tmp/unRAIDServer.txt'}`,
        modalTitle,
        600,
        900
      );
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
    formattedReleaseDate,
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
