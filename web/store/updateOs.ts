import { BellAlertIcon } from '@heroicons/vue/24/solid';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import gt from 'semver/functions/gt';

import useInstallPlugin from '~/composables/installPlugin';
import { request } from '~/composables/services/request';
import { ACCOUNT_CALLBACK, OS_RELEASES } from '~/helpers/urls';
import { useCallbackStore } from '~/store/callbackActions';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import type { InstallPluginPayload } from '~/composables/installPlugin';
import type { OsRelease } from '~/store/callback';
import type { ServerStateDataAction } from '~/types/server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useUpdateOsStore = defineStore('updateOs', () => {
  const callbackStore = useCallbackStore();
  const errorsStore = useErrorsStore();
  const serverStore = useServerStore();

  const { install: installPlugin } = useInstallPlugin();

  // State
  const status = ref<'confirming' | 'failed' | 'ready' | 'success' | 'updating' | 'downgrading'>('ready');
  const callbackUpdateRelease = ref<OsRelease | undefined>(); // used when coming back from callback, this will be the release to install
  const updateAvailable = ref<OsRelease | undefined>(); // used locally to show update action button
  const downgradeAvailable = ref<boolean>(false);

  // Getters
  const currentOsVersion = computed((): string => serverStore?.osVersion);

  // Actions
  const checkForOsUpdate = async () => {
    console.debug('[checkForOsUpdate]');

    if (!currentOsVersion.value) {
      return console.error('[checkForOsUpdate] currentOsVersion not found, skipping OS update check');
    }

    const response: OsRelease[] = await request.url(OS_RELEASES.toString()).get().json();
    console.debug('[checkForOsUpdate] response', response);

    if (response) {
      response.forEach(release => {
        const releaseVersion = release.name.replace('Unraid ', '');
        console.debug('[checkForOsUpdate] releaseVersion', releaseVersion);
        if (gt(releaseVersion, '6.12.3')) { // currentOsVersion.value
          updateAvailable.value = release;
          return; // stop looping, we found an update
        }
      });
    }
  };

  const initUpdateOsCallback = computed((): ServerStateDataAction => {
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
      emphasize: true,
      external: true,
      icon: BellAlertIcon,
      name: 'updateOs',
      text: 'Unraid OS Update Available',
    }
  });

  const confirmUpdateOs = (payload: OsRelease) => {
    console.debug('[confirmUpdateOs]');
    callbackUpdateRelease.value = payload;
    setStatus('confirming');
  };

  const installOsUpdate = () => {
    console.debug('[installOsUpdate]', callbackUpdateRelease.value);
    if (!callbackUpdateRelease.value) {
      return console.error('[installOsUpdate] release not found');
    }

    status.value = 'updating';
    installPlugin({
      modalTitle: `${callbackUpdateRelease.value.name} Update`,
      pluginUrl: callbackUpdateRelease.value.url,
      update: true,
    });
  };

  const downgradeOs = async () => {
    console.debug('[downgradeOs]');
    setStatus('downgrading');
  };

  const setStatus = (payload: typeof status.value) => {
    status.value = payload;
  };

  return {
    // State
    callbackUpdateRelease,
    status,
    updateAvailable,
    // Actions
    checkForOsUpdate,
    confirmUpdateOs,
    downgradeOs,
    installOsUpdate,
    initUpdateOsCallback,
    setStatus,
  };
});
