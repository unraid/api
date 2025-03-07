<script setup lang="ts">
import { computed } from 'vue';

import { Label } from '@unraid/ui';

const props = defineProps<{
  label: string;
  errors?: string | string[];
}>();

const normalizedErrors = computed(() => {
  if (!props.errors) return [];
  return Array.isArray(props.errors) ? props.errors : [props.errors];
});

const formattedLabel = computed(() => {
  return props.label.endsWith(':') ? props.label : `${props.label}:`;
});
</script>

<template>
  <div class="grid grid-cols-12 items-baseline gap-6">
    <Label class="text-end col-span-4">{{ formattedLabel }}</Label>
    <div class="col-span-8 max-w-3xl">
      <slot></slot>
      <div v-if="normalizedErrors.length > 0" class="mt-2 text-red-500 text-sm">
        <p v-for="error in normalizedErrors" :key="error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>
