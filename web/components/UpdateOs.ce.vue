<script lang="ts" setup>
/**
 * @todo require keyfile to be set before allowing user to check for updates
 * @todo require keyfile to update
 * @todo require valid guid / server state to update
 */
import { useI18n } from 'vue-i18n';

import { useUpdateOsActionsStore } from '~/store/updateOsActions';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const { t } = useI18n();

export interface Props {
  rebootType?: 'downgrade' | 'upgrade' | 'none';
  restoreVersion?: string;
}
const props = withDefaults(defineProps<Props>(), {
  rebootType: 'none',
  restoreVersion: '',
});

const updateOsActionsStore = useUpdateOsActionsStore();

onBeforeMount(() => {
  updateOsActionsStore.setRebootType(props.rebootType);
});
</script>

<template>
  <div class="grid gap-y-24px max-w-1024px mx-auto">
    <UpdateOsStatus :t="t" />
    <UpdateOsUpdate
      v-if="rebootType === 'none'"
      :t="t" />
    <UpdateOsDowngrade
      v-if="restoreVersion && rebootType === 'none'"
      :version="restoreVersion"
      :t="t" />
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
