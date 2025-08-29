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
  <div class="mx-auto grid w-full gap-y-6 px-4" :class="maxWidth">
    <slot />
  </div>
</template>
