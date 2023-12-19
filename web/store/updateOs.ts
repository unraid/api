import dayjs, { extend } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import { computed } from 'vue';

import { useServerStore } from '~/store/server';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

// dayjs plugins
extend(customParseFormat);
extend(relativeTime);

export const useUpdateOsStore = defineStore('updateOs', () => {
  const serverStore = useServerStore();

  const regExp = computed(() => serverStore.regExp);
  const regUpdatesExpired = computed(() => serverStore.regUpdatesExpired);
  const updateOsResponse = computed(() => serverStore.updateOsResponse);

  const releaseDateGtRegExpDate = (releaseDate: number | string, regExpDate: number): boolean => {
    const parsedReleaseDate = dayjs(releaseDate, 'YYYY-MM-DD');
    const parsedUpdateExpirationDate = dayjs(regExpDate ?? undefined);

    return parsedReleaseDate.isAfter(parsedUpdateExpirationDate, 'day');
  };

  const available = computed(() => {
    if (!updateOsResponse.value) {
      return undefined;
    }
    return updateOsResponse.value.isNewer ? updateOsResponse.value.version : undefined;
  });
  const availableWithRenewal = computed(() => {
    if (!available.value || !updateOsResponse.value || !regExp.value || !regUpdatesExpired.value) {
      return undefined;
    }

    return releaseDateGtRegExpDate(updateOsResponse.value.date, regExp.value)
      ? updateOsResponse.value.version
      : undefined;
  });

  return {
    available,
    availableWithRenewal,
  };
});
