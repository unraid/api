<script setup lang="ts">
import { ShieldExclamationIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';
import { useThemeStore } from '~/store/theme';

export interface Props {
  error?: boolean;
  label?: string;
  text?: number | string | undefined;
}
const props = withDefaults(defineProps<Props>(), {
  error: false,
  label: '',
  text: '',
});

const { darkMode } = storeToRefs(useThemeStore());

const evenBgColor = computed(() => {
  return darkMode.value ? 'even:bg-grey-darkest' : 'even:bg-black/5';
});

onMounted(() => {
  console.debug('[Item.onMounted]', props);
})
</script>

<template>
  <div
    :class="[
      !error && evenBgColor,
      error && 'text-white bg-unraid-red',
    ]"
    class="text-16px p-16px sm:px-20px sm:grid sm:grid-cols-3 sm:gap-16px items-start"
  >
    <dt class="font-semibold flex flex-row justify-start items-center gap-x-8px">
      <ShieldExclamationIcon v-if="error" class="w-16px h-16px fill-current" />
      <span>{{ label }}</span>
    </dt>
    <dd class="mt-4px leading-normal sm:col-span-2 sm:mt-0">
      <span v-if="text" class="opacity-75 select-all">{{ text }}</span>
      <template v-if="$slots['right']">
        <slot name="right"></slot>
      </template>
    </dd>
  </div>
</template>
