import dayjs, { extend } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import { computed } from 'vue';

import { WebguiCheckForUpdate } from '~/composables/services/webgui';
import { useServerStore } from '~/store/server';
import type { ServerUpdateOsResponse } from '~/types/server';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

// dayjs plugins
extend(customParseFormat);
extend(relativeTime);

export const useUpdateOsStore = defineStore('updateOs', () => {
  // state
  const checkForUpdatesLoading = ref<boolean>(false);
  const modalOpen = ref<boolean>(false);
  // getters from other stores
  const serverStore = useServerStore();

  const regExp = computed(() => serverStore.regExp);
  const regUpdatesExpired = computed(() => serverStore.regUpdatesExpired);
  const updateOsResponse = computed(() => serverStore.updateOsResponse);
  const updateOsIgnoredReleases = computed(() => serverStore.updateOsIgnoredReleases);
  // local getters
  const available = computed(() => {
    if (!updateOsResponse.value) {
      return undefined;
    }
    // ignore any releases that are in the updateOsIgnoredReleases array
    if (updateOsIgnoredReleases.value.includes(updateOsResponse.value.version)) {
      return undefined;
    }
    return updateOsResponse.value.isNewer ? updateOsResponse.value.version : undefined;
  });
  const availableWithRenewal = computed(() => {
    if (!available.value || !updateOsResponse.value || !regExp.value || !regUpdatesExpired.value) {
      return undefined;
    }

    return updateOsResponse.value.isNewer && releaseDateGtRegExpDate(updateOsResponse.value.date, regExp.value)
      ? updateOsResponse.value.version
      : undefined;
  });

  const availableReleaseDate = computed(() => updateOsResponse.value?.date ? dayjs(updateOsResponse.value.date, 'YYYY-MM-DD') : undefined);

  // actions
  const releaseDateGtRegExpDate = (releaseDate: number | string, regExpDate: number): boolean => {
    const parsedReleaseDate = dayjs(releaseDate, 'YYYY-MM-DD');
    const parsedUpdateExpirationDate = dayjs(regExpDate ?? undefined);

    return parsedReleaseDate.isAfter(parsedUpdateExpirationDate, 'day');
  };

  const localCheckForUpdate = async (): Promise<void> => {
    checkForUpdatesLoading.value = true;
    setModalOpen(true);
    try {
      const response = await WebguiCheckForUpdate();
      console.debug('[localCheckForUpdate] response', response);
      serverStore.setUpdateOsResponse(response as ServerUpdateOsResponse);
      checkForUpdatesLoading.value = false;
    } catch (error) {
      throw new Error('[localCheckForUpdate] Error checking for updates');
    }
  };

  const setModalOpen = (val: boolean) => {
    modalOpen.value = val;
  };

  return {
    // state
    available,
    availableWithRenewal,
    checkForUpdatesLoading,
    modalOpen,
    updateOsIgnoredReleases,
    // getters
    availableReleaseDate,
    // actions
    localCheckForUpdate,
    setModalOpen,
  };
});
