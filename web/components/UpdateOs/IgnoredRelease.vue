<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { XMarkIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';

import type { ComposerTranslation } from 'vue-i18n';

import { useServerStore } from '~/store/server';
import { useThemeStore } from '~/store/theme';

export interface Props {
  label?: string;
  t: ComposerTranslation;
}

withDefaults(defineProps<Props>(), {
  label: '',
});

const serverStore = useServerStore();
const { darkMode } = storeToRefs(useThemeStore());

const evenBgColor = computed(() => {
  return darkMode.value ? 'even:bg-grey-darkest' : 'even:bg-black/5';
});
</script>

<template>
  <div
    class="text-base p-3 flex flex-row gap-1 sm:px-5 sm:gap-4 items-center justify-between rounded"
    :class="evenBgColor"
  >
    <span class="font-semibold">{{ label }}</span>
    <BrandButton
      variant="underline"
      :icon-right="XMarkIcon"
      :text="t('Remove')"
      :title="t('Remove from ignore list')"
      @click="serverStore.updateOsRemoveIgnoredRelease(label)"
    />
  </div>
</template>
