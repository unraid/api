<script setup lang="ts">
import { CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/solid';

export interface Props {
  error?: boolean;
  icon?: typeof CheckCircleIcon;
  success?: boolean;
  text?: string;
}

withDefaults(defineProps<Props>(), {
  error: false,
  icon: undefined,
  success: false,
  text: undefined,
});
</script>

<template>
  <div class="mx-auto max-w-[45ch] flex flex-col gap-2">
    <div class="flex items-start justify-center gap-x-2">
      <CheckCircleIcon v-if="success" class="fill-green-600 w-7 shrink-0" />
      <XCircleIcon v-if="error" class="fill-unraid-red w-7 shrink-0" />
      <component :is="icon" v-if="icon" class="fill-current opacity-75 w-7 shrink-0" />
      <p class="text-lg">
        {{ text }}
      </p>
    </div>
    <slot />
  </div>
</template>
