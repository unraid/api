import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

// import { DOCS_RELEASE_NOTES } from '~/helpers/urls';
import prerelease from 'semver/functions/prerelease';

import type { ServerUpdateOsResponse } from '~/types/server';
import { useCallbackActionsStore } from '~/store/callbackActions';

export const useUpdateOsChangelogStore = defineStore('updateOsChangelog', () => {
  const callbackStore = useCallbackActionsStore();

  const releaseForUpdate = ref<ServerUpdateOsResponse | null>(null);

  const changelogUrl = computed((): string => releaseForUpdate.value?.changelog || '');

  const changelogPretty = computed(() => releaseForUpdate.value?.changelogPretty ?? null);

  const isReleaseForUpdateStable = computed(() =>
    releaseForUpdate.value ? prerelease(releaseForUpdate.value.version) === null : false
  );

  const setReleaseForUpdate = (release: ServerUpdateOsResponse | null) => {
    releaseForUpdate.value = release;
  };

  const fetchAndConfirmInstall = (sha256: string) => {
    callbackStore.send(
      window.location.href,
      [
        {
          sha256,
          type: 'updateOs',
        },
      ],
      undefined,
      'forUpc'
    );
  };

  return {
    // state
    releaseForUpdate,
    // getters
    isReleaseForUpdateStable,
    changelogPretty,
    changelogUrl,
    // actions
    setReleaseForUpdate,
    fetchAndConfirmInstall,
  };
});
