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
  success: false,
});
</script>

<template>
  <div class="mx-auto max-w-[45ch]">
    <div class="flex items-start justify-start gap-x-8px">
      <CheckCircleIcon v-if="success" class="fill-green-600 w-28px shrink-0" />
      <XCircleIcon v-if="error" class="fill-unraid-red w-28px shrink-0" />
      <component v-if="icon" :is="icon" class="fill-current opacity-75 w-28px shrink-0" />
      <p class="text-18px">{{ text }}</p>
    </div>
    <slot></slot>
  </div>
</template>