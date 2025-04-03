<script setup lang="ts">
import { Label } from '@/components/form/label';
import { computed } from 'vue';

const props = defineProps<{
  label: string;
  errors?: string | string[];
}>();

const normalizedErrors = computed(() => {
  if (!props.errors) return [];
  return Array.isArray(props.errors) ? props.errors : [props.errors];
});

// ensures the label ends with a colon
// todo: in RTL locales, this probably isn't desirable
const formattedLabel = computed(() => {
  return props.label.endsWith(':') ? props.label : `${props.label}:`;
});
</script>

<template>
  <div class="grid grid-cols-settings items-baseline">
    <Label class="text-end">{{ formattedLabel }}</Label>
    <div class="ml-10 max-w-3xl">
      <slot />
      <div v-if="normalizedErrors.length > 0" class="mt-2 text-red-500 text-sm">
        <p v-for="error in normalizedErrors" :key="error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>
