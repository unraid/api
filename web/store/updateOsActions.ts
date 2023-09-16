import testOsReleasesResponse from '~/_data/osReleases'; // test data

import { BellAlertIcon } from '@heroicons/vue/24/solid';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import gt from 'semver/functions/gt';
import coerce from 'semver/functions/coerce';
import type { SemVer } from 'semver';

import useInstallPlugin from '~/composables/installPlugin';
import { request } from '~/composables/services/request';

import { ACCOUNT_CALLBACK, OS_RELEASES } from '~/helpers/urls';

import { useCallbackStore } from '~/store/callbackActions';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import {
  useUpdateOsStoreGeneric,
  type Release,
  type ReleasesResponse,
  type CachedReleasesResponse,
  type UpdateOsActionStore,
} from '~/store/updateOs';

import { type InstallPluginPayload } from '~/composables/installPlugin';
import type { ServerStateDataAction } from '~/types/server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useUpdateOsActionsStore = defineStore('updateOsActions', () => {
  const callbackStore = useCallbackStore();
  const errorsStore = useErrorsStore();
  const serverStore = useServerStore();
  const updateOsStoreGeneric = useUpdateOsStoreGeneric();

  const { install: installPlugin } = useInstallPlugin();

  // State
  const osVersion = computed(() => serverStore.osVersion);
  /** used when coming back from callback, this will be the release to install */
  const status = ref<'confirming' | 'failed' | 'ready' | 'success' | 'updating' | 'downgrading'>('ready');
  const callbackUpdateRelease = ref<Release | null>(null);

  // Actions
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

  const downgradeOs = async () => {
    setStatus('downgrading');
  };

  const setStatus = (payload: typeof status.value) => {
    status.value = payload;
  };

  return {
    // State
    osVersion,
    callbackUpdateRelease,
    status,
    // Actions
    confirmUpdateOs,
    downgradeOs,
    installOsUpdate,
    initUpdateOsCallback,
    setStatus,
  };
});

export const useUpdateOsStore = useUpdateOsStoreGeneric(useUpdateOsActionsStore as unknown as () => UpdateOsActionStore);
