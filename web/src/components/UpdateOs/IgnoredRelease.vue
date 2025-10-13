<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { XMarkIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';

import { useServerStore } from '~/store/server';
import { useThemeStore } from '~/store/theme';

export interface Props {
  label?: string;
}

const { label = '' } = defineProps<Props>();
const { t } = useI18n();

const serverStore = useServerStore();
const { darkMode } = storeToRefs(useThemeStore());

const evenBgColor = computed(() => {
  return darkMode.value ? 'even:bg-grey-darkest' : 'even:bg-black/5';
});
</script>

<template>
  <div
    class="flex flex-row items-center justify-between gap-1 rounded p-3 text-base sm:gap-4 sm:px-5"
    :class="evenBgColor"
  >
    <span class="font-semibold">{{ label }}</span>
    <BrandButton
      variant="underline"
      :icon-right="XMarkIcon"
      :text="t('updateOs.ignoredRelease.remove')"
      :title="t('updateOs.ignoredRelease.removeFromIgnoreList')"
      @click="serverStore.updateOsRemoveIgnoredRelease(label)"
    />
  </div>
</template>
