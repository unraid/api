<script setup lang="ts">
import { computed } from 'vue';
import { ShieldExclamationIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';

import { useThemeStore } from '~/store/theme';
import type { RegistrationItemProps } from '~/types/registration';

withDefaults(defineProps<RegistrationItemProps>(), {
  error: false,
  text: '',
  warning: false,
});

const { darkMode } = storeToRefs(useThemeStore());

const evenBgColor = computed(() => {
  return darkMode.value ? 'even:bg-grey-darkest' : 'even:bg-black/5';
});
</script>

<template>
  <div
    :class="[
      !error && !warning && evenBgColor,
      error && 'text-white bg-unraid-red',
      warning && 'text-black bg-yellow-100',
    ]"
    class="text-16px p-12px grid grid-cols-1 gap-4px sm:px-20px sm:grid-cols-5 sm:gap-16px items-baseline rounded"
  >
    <dt v-if="label" class="font-semibold leading-normal sm:col-span-2 flex flex-row sm:justify-end sm:text-right items-center gap-x-8px">
      <ShieldExclamationIcon v-if="error" class="w-16px h-16px fill-current" />
      <span v-html="label" />
    </dt>
    <dd
      class="leading-normal sm:col-span-3"
      :class="!label && 'sm:col-start-2'"
    >
      <span
        v-if="text"
        class="select-all"
        :class="{
          'opacity-75': !error,
        }"
      >
        {{ text }}
      </span>
      <template v-if="$slots['right']">
        <slot name="right" />
      </template>
    </dd>
  </div>
</template>
