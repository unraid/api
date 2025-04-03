<script setup lang="ts">
withDefaults(
  defineProps<{
    maxWidth?: string;
  }>(),
  {
    maxWidth: 'max-w-1024px',
  }
);
</script>

<template>
  <div class="grid gap-y-24px w-full mx-auto px-16px" :class="maxWidth">
    <slot />
  </div>
</template>
