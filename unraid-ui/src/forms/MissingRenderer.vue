<template>
  <div>
    <p>Missing renderer for:</p>
    <pre>{{ props }}</pre>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps({
  // Define props based on what JsonForms passes to renderers
  // Typically includes 'schema', 'uischema', 'path', 'data', 'errors', etc.
  // Add specific props as needed, or leave it generic for now
});

// eslint-disable-next-line no-console
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
