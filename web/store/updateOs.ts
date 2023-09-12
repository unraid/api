import { BellAlertIcon } from '@heroicons/vue/24/solid';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import gt from 'semver/functions/gt';

import { request } from '~/composables/services/request';
import { ACCOUNT_CALLBACK, OS_RELEASES } from '~/helpers/urls';
import { useCallbackStore } from '~/store/callbackActions';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import type { ServerStateDataAction } from '~/types/server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export interface OsRelease {
  basefile: string; // "unRAIDServer-6.12.4-x86_64.zip"
  changelog: string; // "https://unraid-dl.sfo2.cdn.digitaloceanspaces.com/stable/unRAIDServer-6.12.4-x86_64.txt"
  date: string; // "2023-08-31"
  md5: string; // "df6e5859d28c14617efde36d59458206"
  name: string; // "Unraid 6.12.4"
  size: string; // "439999418"
  url: string; // "https://unraid-dl.sfo2.cdn.digitaloceanspaces.com/stable/unRAIDServer-6.12.4-x86_64.zip"
}

export const useUpdateOsStore = defineStore('updateOs', () => {
  const callbackStore = useCallbackStore();
  const errorsStore = useErrorsStore();
  const serverStore = useServerStore();

  // State
  const status = ref<'failed' | 'ready' | 'success' | 'updating' | 'downgrading'>('ready');
  const updateAvailable = ref<OsRelease | undefined>();
  watchEffect(() => {
    if (updateAvailable.value) {
      console.debug('[useUpdateOsStore] updateAvailable', updateAvailable.value);
    }
  });
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

  const downgradeOs = async () => {
    console.debug('[downgradeOs]');
    status.value = 'downgrading';
  };

  const installOsUpdate = (plgUrl: string) => {
    console.debug('[installOsUpdate]', plgUrl);
    status.value = 'updating';
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

  return {
    // State
    status,
    updateAvailable,
    // Actions
    checkForOsUpdate,
    downgradeOs,
    installOsUpdate,
    initUpdateOsCallback,
  };
});
