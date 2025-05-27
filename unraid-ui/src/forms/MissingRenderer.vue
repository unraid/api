<template>
  <div>
    <p>Missing renderer for:</p>
    <pre>{{ props }}</pre>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
  schema?: object;
  uischema?: object;
  path?: string;
  data?: unknown;
  errors?: string;
}>();

console.warn('Missing renderer used for:', props);
</script>

<style scoped>
/* Add styles if needed */
div {
  border: 1px dashed red;
  padding: 1em;
  margin: 1em 0;
}
</style>
