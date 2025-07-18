<script setup lang="ts">
withDefaults(
  defineProps<{
    maxWidth?: string;
  }>(),
  {
    maxWidth: 'max-w-[1024px]',
  }
);
</script>

<template>
  <div class="grid gap-y-6 w-full mx-auto px-4" :class="maxWidth">
    <slot />
  </div>
</template>
