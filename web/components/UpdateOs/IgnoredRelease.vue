<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';

import { useI18n } from '~/composables/useI18n';
import { useServerStore } from '~/store/server';
import { useThemeStore } from '~/store/theme';

export interface Props {
  label?: string;
}

withDefaults(defineProps<Props>(), {
  label: '',
});

const { $t } = useI18n();
const serverStore = useServerStore();
const { darkMode } = storeToRefs(useThemeStore());

const evenBgColor = computed(() => {
  return darkMode.value ? 'even:bg-grey-darkest' : 'even:bg-black/5';
});
</script>

<template>
  <div
    class="text-16px p-12px flex flex-row gap-4px sm:px-20px sm:gap-16px items-center justify-between rounded"
    :class="evenBgColor"
  >
    <span class="font-semibold">{{ label }}</span>
    <BrandButton
      variant="underline"
      :icon-right="XMarkIcon"
      :text="$t('Remove')"
      :title="$t('Remove from ignore list')"
      @click="serverStore.updateOsRemoveIgnoredRelease(label)"
    />
  </div>
</template>
