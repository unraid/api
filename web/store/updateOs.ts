import dayjs, { extend } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import gt from 'semver/functions/gt';
import prerelease from 'semver/functions/prerelease';
import type { SemVer } from 'semver';
import { computed, ref } from 'vue';
import wretch from 'wretch';

import {
  ACCOUNT,
  OS_RELEASES,
  OS_RELEASES_NEXT,
  OS_RELEASES_PREVIEW,
} from '@/helpers/urls';

export type OsVersionBranch = 'stable' | 'next' | 'preview' | 'test';

export interface RequestReleasesPayload {
  cache?: boolean; // saves response to localStorage
  guid: string;
  keyfile: string;
  osVersion: SemVer | string;
  osVersionBranch: OsVersionBranch;
  skipCache?: boolean; // forces a refetch from the api
}

export interface Release {
  version: string; // "6.12.4"
  name: string; // "Unraid 6.12.4"
  basefile: string; // "unRAIDServer-6.12.4-x86_64.zip"
  date: string; // "2023-08-31"
  url: string; // "https://stable.dl.unraid.net/unRAIDServer-6.12.4-x86_64.zip"
  changelog: string; // "https://raw.githubusercontent.com/unraid/docs/main/docs/unraid-os/release-notes/6.12.4.md"
  changelog_pretty: string; // "https://docs.unraid.net/unraid-os/release-notes/6.12.4/"
  md5: string; // "df6e5859d28c14617efde36d59458206"
  size: string; // "439999418"
  sha256: string; // "5ad2d22e8c124e3b925c3bd05f1d782d8521965aabcbedd7dd782db76afd9ace"
  plugin_url: string; // "https://stable.dl.unraid.net/unRAIDServer-6.12.4.plg"
  plugin_sha256: string; // "57d2ab6036e663208b3f72298ceb478b937b17e333986e68dcae2696c88ed152"
  announce_url: string; // "https://unraid.net/blog/6-12-4"
  branch: OsVersionBranch; // "stable"
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

export interface UserInfo {
  email?: string;
  email_verifed?: 'true' | 'false';
  preferred_username?: string;
  sub?: string;
  username?: string;
  /**
   * @param identities {string} JSON string containing @type Identity[]
   */
  identities?: string;
  /**
   * @param cognito:groups {string[]} JSON string containing @type string[]
   *
   * Will contain all groups for the signed in user, used for determining which branch to use
   * @example ["download-preview", "unraidPOOLID_Google"]
   */
  'cognito:groups'?: string[];
}

export interface UpdateOsActionStore {
  isLoggedIn: boolean;
  authUserAttributes: UserInfo;
  osVersion: SemVer | string;
  osVersionBranch: OsVersionBranch;
  regExp: number;
  regUpdatesExpired: boolean;
}

interface UpdateOsStorePayload {
  useUpdateOsActions?: () => UpdateOsActionStore;
  /**
   * If values are added below they need to exported by useUpdateOsActions so that they can be used in the computed properties
   * @note Values below are used in both account.unraid.net and the webgui web components
   */
  currentOsVersion?: SemVer | string;
  currentOsVersionBranch?: OsVersionBranch;
  currentRegExp?: number;
  currentRegUpdatesExpired?: boolean;
  /** @note Values below are only used on account.unraid.net and should be passed in on /server/update-os */
  currentIsLoggedIn?: boolean;
  currentAuthUserGroups?: string[];
}

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

// dayjs plugins
extend(customParseFormat);
extend(relativeTime);

export const RELEASES_LOCAL_STORAGE_KEY = 'unraidReleasesResponse';

export const useUpdateOsStoreGeneric = (payload: UpdateOsStorePayload) =>
  defineStore('updateOs', () => {
    console.debug('[updateOs] payload', payload);
    // Since this file is shared between account.unraid.net and the web components, we need to handle the state differently
    // If useUpdateOsActions is passed in, we're in the webgui web components
    const updateOsActions = payload.useUpdateOsActions !== undefined ? payload.useUpdateOsActions() : undefined;
    console.debug('[updateOs] updateOsActions', updateOsActions);
    // If useUpdateOsActions is not passed in, we're in account.unraid.net
    // creating refs from the passed in values so that we can use them in the computed properties
    const paramCurrentOsVersion = ref<SemVer | string>(payload.currentOsVersion ?? '');
    const paramCurrentOsVersionBranch = ref<SemVer | string>(payload.currentOsVersionBranch ?? '');
    const paramCurrentRegExp = ref<number>(payload.currentRegExp ?? 0);
    const paramCurrentRegUpdatesExpired = ref<boolean>(payload.currentRegUpdatesExpired ?? false);
    const paramCurrentIsLoggedIn = ref<boolean>(payload.currentIsLoggedIn ?? false);
    const paramCurrentAuthUserGroups = ref<string[]>(payload.currentAuthUserGroups ?? []);
    // getters – when set from updateOsActions we're in the webgui web components otherwise we're in account.unraid.net
    const osVersion = computed(() => updateOsActions?.osVersion ?? paramCurrentOsVersion.value ?? '');
    const osVersionBranch = computed(() => updateOsActions?.osVersionBranch ?? paramCurrentOsVersionBranch.value ?? '');
    const regExp = computed(() => updateOsActions?.regExp ?? paramCurrentRegExp.value ?? 0);
    const regUpdatesExpired = computed(() => updateOsActions?.regUpdatesExpired ?? paramCurrentRegUpdatesExpired.value ?? false);
    const isLoggedIn = computed(() => updateOsActions?.isLoggedIn ?? paramCurrentIsLoggedIn.value ?? false);
    const authUserGroups = computed(() => updateOsActions?.currentAuthUserGroups ?? paramCurrentAuthUserGroups.value ?? []);

    // state
    const available = ref<string>('');
    const availableWithRenewal = ref<string>('');
    const releases = ref<CachedReleasesResponse | undefined>(localStorage.getItem(RELEASES_LOCAL_STORAGE_KEY) ? JSON.parse(localStorage.getItem(RELEASES_LOCAL_STORAGE_KEY) ?? '') : undefined);
    const releasesError = ref<string>('');

    // getters
    const parsedReleaseTimestamp = computed(() => {
      if (!releases.value?.timestamp) { return undefined; }
      return {
        formatted: dayjs(releases.value?.timestamp).format('YYYY-MM-DD HH:mm:ss'),
        relative: dayjs().to(dayjs(releases.value?.timestamp)),
      };
    });

    const isOsVersionStable = computed(() => isVersionStable(osVersion.value));
    const isAvailableStable = computed(() => available.value ? isVersionStable(available.value) : false);

    const filteredNextReleases = computed(() => {
      if (!osVersion.value) return undefined;

      if (releases.value?.response?.next) {
        return releases.value?.response?.next.filter(
          release => gt(release.version, osVersion.value as string)
        );
      }
      return undefined;
    });

    const filteredPreviewReleases = computed(() => {
      if (!osVersion.value) return undefined;

      if (releases.value?.response?.preview) {
        return releases.value?.response?.preview.filter(
          release => gt(release.version, osVersion.value as string)
        );
      }
      return undefined;
    });

    const filteredStableReleases = computed(() => {
      if (!osVersion.value) return undefined;

      if (releases.value?.response?.stable) {
        return releases.value?.response?.stable.filter(
          release => gt(release.version, osVersion.value as string)
        );
      }
      return undefined;
    });

    const filteredTestReleases = computed(() => {
      if (!osVersion.value) return undefined;

      if (releases.value?.response?.test) {
        return releases.value?.response?.test.filter(
          release => gt(release.version, osVersion.value as string)
        );
      }
      return undefined;
    });

    const allFilteredReleases = computed(() => {
      if (!filteredNextReleases.value && !filteredPreviewReleases.value && !filteredStableReleases.value && !filteredTestReleases.value) {
        return undefined;
      }

      return {
        ...(filteredStableReleases.value && { stable: [...filteredStableReleases.value] }),
        ...(filteredNextReleases.value && { next: [...filteredNextReleases.value] }),
        ...(filteredPreviewReleases.value && { preview: [...filteredPreviewReleases.value] }),
        ...(filteredTestReleases.value && { test: [...filteredTestReleases.value] }),
      }
    });

    /**
     * We need two ways of determining which branch to use:
     * 1. On the server webgui use the osVersionBranch param
     * 2. On account.unraid.net we can use the user's auth to determine which branch to use
     */
    const releasesUrl = computed((): typeof OS_RELEASES => {
      const isOnAccountApp = window.location.origin === ACCOUNT.origin;

      const webguiNextBranch = !isOnAccountApp && osVersionBranch.value === 'next';
      const webguiPreviewBranch = !isOnAccountApp && osVersionBranch.value === 'preview';
      const webguiTestBranch = !isOnAccountApp && osVersionBranch.value === 'test';

      const accountAppLoggedIn = isOnAccountApp && isLoggedIn.value;
      /** @todo should we remove the || checks directly below and only rely on the group? */
      const accountAppPreviewBranch = accountAppLoggedIn && (osVersionBranch.value === 'preview' || (authUserGroups.value && authUserGroups.value.includes('download-preview')));
      const accountAppTestBranch = accountAppLoggedIn && (osVersionBranch.value === 'test' || (authUserGroups.value && authUserGroups.value.includes('download-test')));
      console.debug('[releasesUrl]', {
        isOnAccountApp,
        webguiNextBranch,
        webguiPreviewBranch,
        webguiTestBranch,
        accountAppLoggedIn,
        accountAppPreviewBranch,
        accountAppTestBranch,
      });

      const useNextBranch = webguiNextBranch || accountAppLoggedIn;
      const usePreviewBranch = webguiPreviewBranch || accountAppPreviewBranch;
      const useTestBranch = webguiTestBranch || accountAppTestBranch;
      console.debug('[releasesUrl]', {
        useNextBranch,
        usePreviewBranch,
        useTestBranch,
      });

      let releasesUrl = OS_RELEASES;
      if (useNextBranch) releasesUrl = OS_RELEASES_NEXT;
      if (usePreviewBranch || useTestBranch || import.meta.env.VITE_OS_RELEASES_PREVIEW_FORCE) releasesUrl = OS_RELEASES_PREVIEW;
      /** @todo implement separate test branch json once available */
      // if (useTestBranch) releasesUrl = OS_RELEASES_PREVIEW.toString();
      return releasesUrl;
    });
    // actions
    const setReleasesState = (response: ReleasesResponse) => {
      releases.value = {
        timestamp: Date.now(),
        response,
      };
    }

    const cacheReleasesResponse = () => {
      localStorage.setItem(RELEASES_LOCAL_STORAGE_KEY, JSON.stringify(releases.value));
    };

    const purgeReleasesCache = async () => {
      releases.value = undefined;
      await localStorage.removeItem(RELEASES_LOCAL_STORAGE_KEY);
    };

    const requestReleases = async (payload: RequestReleasesPayload): Promise<ReleasesResponse | undefined> => {
      console.debug('[requestReleases]', payload);

      if (!payload || !payload.osVersion || !payload.osVersionBranch || !payload.guid || !payload.keyfile) {
        throw new Error('Invalid Payload for updateOs.requestReleases');
      }

      if (payload.skipCache) {
        await purgeReleasesCache();
      } else if (!payload.skipCache && releases.value) {
        /**
        * Compare the timestamp of the cached releases data to the current time,
        * if it's older than 7 days, reset releases.
        * Which will trigger a new API call to get the releases.
        * Otherwise skip the API call and use the cached data.
        */
       const currentTime = new Date().getTime();
       const cacheDuration = import.meta.env.DEV ? 30000 : 604800000; // 30 seconds for testing, 7 days for prod
       if (currentTime - releases.value.timestamp > cacheDuration) {
        // cache is expired, purge it
         console.debug('[requestReleases] cache EXPIRED');
         await purgeReleasesCache();
       } else {
         // if the cache is valid return the existing response
         console.debug('[requestReleases] cache VALID', releases.value.response);
         return releases.value.response;
       }
     }

      // If here we're needing to fetch a new releases…whether it's the first time or b/c the cache was expired
      try {
        console.debug('[requestReleases] fetching new releases from', releasesUrl.value.toString());
        const response: ReleasesResponse = await wretch(releasesUrl.value.toString()).get().json();
        console.debug('[requestReleases] response', response);
        /**
         * @note for testing with static json a structuredClone is required otherwise Vue will not provide a fully reactive object from the original static response
         * const response: ReleasesResponse = await structuredClone(testReleasesResponse);
         */

        // save it to local state
        setReleasesState(response);
        if (payload.cache) {
          cacheReleasesResponse();
        }

        return response;
      } catch (error) {
        let errorMessage = 'Unknown error';
        if (typeof error === 'string') {
          errorMessage = error.toUpperCase();
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        releasesError.value = errorMessage;
        console.error('[requestReleases]', error);
      }
    };

    const checkForUpdate = async (payload: RequestReleasesPayload) => {
      console.debug('[checkForUpdate]', payload);

      if (!payload || !payload.osVersion || !payload.osVersionBranch || !payload.guid || !payload.keyfile) {
        console.error('[checkForUpdate] invalid payload');
        throw new Error('Invalid Payload for updateOs.checkForUpdate');
      }

      // reset any available
      available.value = '';
      availableWithRenewal.value = '';

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
            // before we set the available version, check if the license key updates have expired to ensure we don't show an update that the user can't install
            if (regUpdatesExpired.value && releaseDateGtRegExpDate(release.date, regExp.value)) {
              // then save the value to use throughout messaging
              if (!availableWithRenewal.value) { // so we don't overwrite a newer version
                availableWithRenewal.value = release.version;
              }
              return false;
            }
            available.value = release.version;
            return true;
          }
          return false;
        });
      });
    };

    const findRelease = (searchKey: keyof Release, searchValue: string): Release | null => {
      const response = releases?.value?.response;
      if (!response) return null;

      for (const key of Object.keys(response)) {
        const branchReleases = response[key as keyof ReleasesResponse];
        if (!branchReleases || branchReleases.length === 0) continue;

        const foundRelease = branchReleases.find(release => release[searchKey] === searchValue);
        if (foundRelease) return foundRelease;
      }

      return null;
    };

    const isVersionStable = (version: SemVer | string): boolean => prerelease(version) === null;
    /**
     * @returns boolean – true should block the update and require key renewal, false should allow the update without key renewal
     */
    const releaseDateGtRegExpDate = (releaseDate: number | string, regExpDate: number): boolean => {
      const parsedReleaseDate = dayjs(releaseDate, 'YYYY-MM-DD');
      const parsedUpdateExpirationDate = dayjs(regExpDate ?? undefined);

      return parsedReleaseDate.isAfter(parsedUpdateExpirationDate, 'day');
    };

    return {
      // state
      available,
      availableWithRenewal,
      releases,
      releasesError,
      // getters
      parsedReleaseTimestamp,
      isOsVersionStable,
      isAvailableStable,
      filteredNextReleases,
      filteredPreviewReleases,
      filteredStableReleases,
      filteredTestReleases,
      allFilteredReleases,
      // actions
      checkForUpdate,
      findRelease,
      requestReleases,
      isVersionStable,
      releaseDateGtRegExpDate,
    };
  });
