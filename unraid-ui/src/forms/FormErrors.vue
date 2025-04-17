<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  errors?: string | string[];
}>();

const normalizedErrors = computed(() => {
  if (!props.errors) return [];
  return Array.isArray(props.errors) ? props.errors : [props.errors];
});
</script>

<template>
  <div v-if="normalizedErrors.length > 0" class="mt-2 text-red-500 text-sm">
    <p v-for="error in normalizedErrors" :key="error">{{ error }}</p>
  </div>
</template> 