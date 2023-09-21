import testReleasesResponse from '~/_data/osReleases'; // test data

import { defineStore, createPinia, setActivePinia } from 'pinia';
import gt from 'semver/functions/gt';
import prerelease from 'semver/functions/prerelease';
import type { SemVer } from 'semver';
import { computed, ref } from 'vue';

export interface RequestReleasesPayload {
  cache?: boolean; // saves response to localStorage
  guid: string;
  includeNext?: boolean; // if a user is on a stable release and they want to see what's available on the next branch
  keyfile: string;
  osVersion: SemVer | string;
  skipCache?: boolean; // forces a refetch from the api
}

export interface Release {
  version: string; // 6.12.4
  name: string; // Unraid Server 6.12.4
  basefile: string; // unRAIDServer-6.12.4-x86_64.zip
  date: string; // 2023-08-31
  url: string; // https://dl.stable.unraid.net/unRAIDServer-6.12.4-x86_64.zip
  changelog: string; // https://unraid.net/blog/unraid-os-6.12.4-release-notes
  md5: string; // 9050bddcf415f2d0518804e551c1be98
  size: number; // 12345122
  sha256: string; // fda177bb1336270b24e4df0fd0c1dd0596c44699204f57c83ce70a0f19173be4
  plugin_url: string; // https://dl.stable.unraid.net/unRAIDServer-6.12.4.plg
  plugin_sha256: string; // 83850536ed6982bd582ed107d977d59e9b9b786363e698b14d1daf52e2dec2d9"
}
export interface ReleasesResponse {
  stable: Release[];
  next?: Release[];
  preview?: Release[];
  test?: Release[];
}
export interface CachedReleasesResponse {
  timestamp: number;
  response: ReleasesResponse;
}

export interface UpdateOsActionStore {
  osVersion: SemVer | string;
}

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const RELEASES_LOCAL_STORAGE_KEY = 'unraidReleasesResponse';

export const useUpdateOsStoreGeneric = (
  useUpdateOsActions?: () => UpdateOsActionStore,
  currentOsVersion?: SemVer | string,
) =>
  defineStore('updateOs', () => {
    // state
    const available = ref<string>('');
    const releases = ref<CachedReleasesResponse | undefined>(localStorage.getItem(RELEASES_LOCAL_STORAGE_KEY) ? JSON.parse(localStorage.getItem(RELEASES_LOCAL_STORAGE_KEY) ?? '') : undefined);
    const osVersion = ref<SemVer | string>('');

    if (useUpdateOsActions !== undefined) {
      const updateOsActions = useUpdateOsActions();
      osVersion.value = updateOsActions.osVersion;
    } else if (currentOsVersion !== undefined && (typeof currentOsVersion === 'string' || currentOsVersion instanceof SemVer)) {
      osVersion.value = currentOsVersion;
    }

    // getters
    const cachedReleasesTimestamp = computed(() => releases.value?.timestamp);
    const isOsVersionStable = computed(() => !isVersionStable(osVersion.value));
    const isAvailableStable = computed(() => {
      if (!available.value) return undefined;
      return !isVersionStable(available.value);
    });

    const filteredStableReleases = computed(() => {
      if (!osVersion.value) return undefined;

      if (releases.value?.response?.stable) {
        return releases.value?.response?.stable.filter(release => {
          console.debug('stable: ', release.version, osVersion.value);
          return gt(release.version, osVersion.value as string);
        });
      }
      return undefined;
    });

    const filteredNextReleases = computed(() => {
      if (!osVersion.value) return undefined;

      if (releases.value?.response?.next) {
        return releases.value?.response?.next.filter(release => {
          console.debug('next: ', release.version, osVersion.value);
          return gt(release.version, osVersion.value as string);
        });
      }
      return undefined;
    });

    const allFilteredReleases = computed(() => {
      if (!filteredStableReleases.value && !filteredNextReleases.value) return undefined;

      return {
        ...(filteredStableReleases.value && { stable: [...filteredStableReleases.value] }),
        ...(filteredNextReleases.value && { next: [...filteredNextReleases.value] }),
      }
    });
    // actions
    const setReleasesState = (response: ReleasesResponse) => {
      console.debug('[setReleasesState]');
      releases.value = {
        timestamp: Date.now(),
        response,
      };
    }

    const cacheReleasesResponse = () => {
      console.debug('[cacheReleasesResponse]');
      localStorage.setItem(RELEASES_LOCAL_STORAGE_KEY, JSON.stringify(releases.value));
    };

    const purgeReleasesCache = async () => {
      console.debug('[purgeReleasesCache]');
      releases.value = undefined;
      await localStorage.removeItem(RELEASES_LOCAL_STORAGE_KEY);
    };

    const requestReleases = async (payload: RequestReleasesPayload): Promise<ReleasesResponse | undefined> => {
      console.debug('[requestReleases]', payload);

      if (!payload || !payload.guid || !payload.keyfile) {
        throw new Error('Invalid Payload for updateOs.requestReleases');
      }

      if (payload.skipCache) {
        await purgeReleasesCache();
      }
      /**
      * Compare the timestamp of the cached releases data to the current time,
      * if it's older than 7 days, reset releases.
      * Which will trigger a new API call to get the releases.
      * Otherwise skip the API call and use the cached data.
      */
     else if (!payload.skipCache && releases.value) {
       const currentTime = new Date().getTime();
       const cacheDuration = import.meta.env.DEV ? 30000 : 604800000; // 30 seconds for testing, 7 days for prod
       if (currentTime - releases.value.timestamp > cacheDuration) {
        // cache is expired, purge it
         console.debug('[requestReleases] cache EXPIRED');
         await purgeReleasesCache();
       } else {
         // if the cache is valid return the existing response
         console.debug('[requestReleases] cache VALID');
         return releases.value.response;
       }
     }

      // If here we're needing to fetch a new releases…whether it's the first time or b/c the cache was expired
      try {
        console.debug('[requestReleases] fetching new releases', testReleasesResponse);
        /**
         * @todo replace with real api call, note that the structuredClone is required otherwise Vue will not provided a reactive object from the original static response
         * const response: ReleasesResponse = await request.url(OS_RELEASES.toString()).get().json();
         */
        const response: ReleasesResponse = await structuredClone(testReleasesResponse);
        console.debug('[requestReleases] response', response);
        /**
         * If we're on stable and the user hasn't requested to include next releases in the check
         * then remove next releases from the data
         */
        console.debug('[requestReleases] checking for next releases', payload.includeNext, response.next)
        if (!payload.includeNext && response.next) {
          console.debug('[requestReleases] removing next releases from data')
          delete response.next;
        }

        // save it to local state
        setReleasesState(response);
        if (payload.cache) {
          cacheReleasesResponse();
        }

        return response;
      } catch (error) {
        console.error('[requestReleases]', error);
      }
    };

    const checkForUpdate = async (payload: RequestReleasesPayload) => {
      console.debug('[checkForUpdate]', payload);

      if (!payload || !payload.osVersion || !payload.guid || !payload.keyfile) {
        console.error('[checkForUpdate] invalid payload');
        throw new Error('Invalid Payload for updateOs.checkForUpdate');
      }

      // set the osVersion since this is the first thing in this store using it…that way we don't need to import the server store in this store.
      osVersion.value = payload.osVersion;

      // reset available
      available.value = '';

      // gets releases from cache or fetches from api
      await requestReleases(payload);

      if (!releases.value) {
        return console.error('[checkForUpdate] no releases found');
      }

      Object.keys(releases.value.response ?? {}).forEach(key => {
        // this is just to make TS happy (it's already checked above…thanks github copilot for knowing what I needed)
        if (!releases.value) {
          return;
        }
        // if we've already found an available update, skip the rest
        if (available.value) {
          return;
        }

        const branchReleases = releases.value.response[key as keyof ReleasesResponse];

        if (!branchReleases || branchReleases.length === 0) {
          return;
        }

        branchReleases.find(release => {
          if (gt(release.version, osVersion.value)) {
            available.value = release.version;
            return true;
          }
        });
      });
    };

    const findReleaseByMd5 = (releaseMd5: string): Release | null => {
      let releaseForReturn: Release | null = null;

      Object.keys(releases.value?.response ?? {}).forEach(key => {
        const branchReleases = releases.value?.response[key as keyof ReleasesResponse];

        if (releaseForReturn || !branchReleases || branchReleases.length == 0) {
          return;
        }

        branchReleases.find(release => {
          if (release.md5 === releaseMd5) {;
            releaseForReturn = release;
            return release;
          }
        });
      });

      return releaseForReturn;
    };

    const isVersionStable = (version: SemVer | string): boolean => prerelease(version) === null;

    return {
      // state
      available,
      releases,
      // getters
      cachedReleasesTimestamp,
      isOsVersionStable,
      isAvailableStable,
      filteredStableReleases,
      filteredNextReleases,
      allFilteredReleases,
      // actions
      checkForUpdate,
      findReleaseByMd5,
      requestReleases,
      isVersionStable,
    };
  });
