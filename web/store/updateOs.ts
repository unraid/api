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
import type { InstallPluginPayload } from '~/composables/installPlugin';
import type { OsRelease, OsReleasesResponse } from '~/store/callback';
import type { ServerStateDataAction } from '~/types/server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export interface CachedOsReleasesResponse {
  timestamp: number;
  response: OsReleasesResponse;
}

export const useUpdateOsStore = defineStore('updateOs', () => {
  const callbackStore = useCallbackStore();
  const errorsStore = useErrorsStore();
  const serverStore = useServerStore();

  const { install: installPlugin } = useInstallPlugin();

  // State
  const status = ref<'confirming' | 'failed' | 'ready' | 'success' | 'updating' | 'downgrading'>('ready');
  const releasesJson = ref<CachedOsReleasesResponse | undefined>(localStorage.getItem('releasesJson') ? JSON.parse(localStorage.getItem('releasesJson') ?? '') : undefined);
  const callbackUpdateRelease = ref<OsRelease | undefined>(); // used when coming back from callback, this will be the release to install
  const updateAvailable = ref<OsRelease | undefined>(); // used locally to show update action button
  const downgradeAvailable = ref<boolean>(false);

  // Getters
  const currentOsVersion = computed(() => serverStore?.osVersion);
  const isOsVersionStable = computed(() => serverStore?.isOsVersionStable); // used to determine if we should look for stable or next releases
  // const currentOsVersionNext = computed((): boolean => serverStore?.osVersionNext);

  // Actions
  const fetchOsReleases = async () => {
    try {
      // const response: OsReleasesResponse = await request.url(OS_RELEASES.toString()).get().json();
      const response = testOsReleasesResponse;
      releasesJson.value = {
        timestamp: Date.now(),
        response,
      };
      localStorage.setItem('releasesJson', JSON.stringify(releasesJson.value));
    } catch (error) {
      console.error('[fetchOsReleases]', error);
    }
  };
  const purgeReleasesJsonCache = () => {
    releasesJson.value = undefined;
    localStorage.removeItem('releasesJson');
  };
  const checkForOsUpdate = async (skipCache: boolean = false, includeNext: boolean = false) => {
    if (!currentOsVersion.value) {
      return console.error('[checkForOsUpdate] currentOsVersion not found, skipping OS update check');
    }

    if (skipCache) { // forces new check
      purgeReleasesJsonCache();
    }

    try {
      /**
     * Compare the timestamp of the cached data to the current time,
     * if it's older than 7 days, reset releasesJson.
     * Which will trigger a new API call to get the releases.
     * Otherwise skip the API call and use the cached data.
     */
      if (releasesJson.value) {
        const currentTime = new Date().getTime();
        const localState = releasesJson.value;
        const cacheDuration = import.meta.env.DEV ? 30000 : 604800000; // 30 seconds for testing, 7 days for prod
        if (currentTime - localState.timestamp > cacheDuration) {
          purgeReleasesJsonCache();
          await fetchOsReleases();
        }
      } else {
        await fetchOsReleases();
      }

      if (releasesJson.value && releasesJson.value.response) {
        /**
         * If we're on stable and the user hasn't requested to include next releases in the check
         * then remove next releases from the cached data
         */
        if (!includeNext && isOsVersionStable.value && releasesJson.value.response.next) {
          delete releasesJson.value.response.next;
        }

        Object.keys(releasesJson.value.response ?? {}).forEach(key => {
          if (!releasesJson.value) { // this is just to make TS happy (it's already checked above…thanks github copilot for knowing what I needed)
            return;
          }

          if (updateAvailable.value) {
            return;
          }

          const releases = releasesJson.value.response[key as keyof OsReleasesResponse];

          if (releases && releases.length > 0) {
            releases.find(release => {
              if (gt(release.version, currentOsVersion.value)) { /** @todo '6.12.0' temporary for dev. Replace with currentOsVersion.value */
                updateAvailable.value = release;
                return true; // stop looping, we found an update
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('[checkForOsUpdate]', error);
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
  /**
   * @description When receiving the callback the Account update page we'll use the provided releaseMd5 to find the release in the releasesJson cache.
   */
  const confirmUpdateOs = async (releaseMd5: string) => {
    /** this should never happen, but if it does we should probably try to fetch the releases again */
    if (!releasesJson.value) {
      await fetchOsReleases();
    };

    Object.keys(releasesJson.value?.response ?? {}).forEach(key => {
      const releases = releasesJson.value?.response[key as keyof OsReleasesResponse];

      if (releases && releases.length > 0) {
        releases.forEach(release => {
          if (release.md5 === releaseMd5) {
            callbackUpdateRelease.value = release;
            return;
          }
        });
      }
    })

    setStatus('confirming');
  };

  const installOsUpdate = () => {
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
