<script setup lang="ts">
import { CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/solid';

export interface Props {
  error?: boolean;
  success?: boolean;
  text?: string;
}

withDefaults(defineProps<Props>(), {
  error: false,
  success: false,
});
</script>

<template>
  <div>
    <div class="flex items-center justify-center gap-x-8px">
      <CheckCircleIcon v-if="success" class="fill-green-600 w-24px" />
      <XCircleIcon v-if="error" class="fill-unraid-red w-24px" />
      <p>{{ text }}</p>
    </div>
    <slot></slot>
  </div>
</template>