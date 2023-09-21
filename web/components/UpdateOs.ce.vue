<script lang="ts" setup>
/**
 * @todo require keyfile to be set before allowing user to check for updates
 * @todo require keyfile to update
 * @todo require valid guid / server state to update
 */
import dayjs, { extend } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import { useUpdateOsStore } from '~/store/updateOsActions';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const { t } = useI18n();

export interface Props {
  restoreVersion?: string;
}
withDefaults(defineProps<Props>(), {
  restoreVersion: '',
});

const updateOsStore = useUpdateOsStore();
const { cachedReleasesTimestamp } = storeToRefs(updateOsStore);

extend(relativeTime);
const parsedReleaseTimestamp = computed(() => {
  if (!cachedReleasesTimestamp.value) { return ''; }
  return {
    formatted: dayjs(cachedReleasesTimestamp.value).format('YYYY-MM-DD HH:mm:ss'),
    relative: dayjs().to(dayjs(cachedReleasesTimestamp.value)),
  };
});
</script>

<template>
  <div class="grid gap-y-24px max-w-1024px mx-auto">
    <UpdateOsStatus :release-check-time="parsedReleaseTimestamp" :t="t" />
    <UpdateOsUpdate :release-check-time="parsedReleaseTimestamp" :t="t" />
    <UpdateOsDowngrade v-if="restoreVersion" :version="restoreVersion" :t="t" />
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
