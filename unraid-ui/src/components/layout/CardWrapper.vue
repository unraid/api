<script setup lang="ts">
withDefaults(
  defineProps<{
    error?: boolean;
    hover?: boolean;
    increasedPadding?: boolean;
    padding?: boolean;
    warning?: boolean;
  }>(),
  {
    error: false,
    hover: true,
    increasedPadding: false,
    padding: true,
    warning: false,
  }
);
</script>

<template>
  <div
    class="group/card relative flex flex-1 flex-col rounded-md border-2 border-solid text-left shadow-md"
    :class="[
      padding && 'p-4',
      increasedPadding && 'md:p-6',
      hover && 'hover:shadow-orange/50 transition-all',
      error && 'bg-unraid-red border-unraid-red text-white',
      warning && 'border-yellow-100 bg-yellow-100 text-black',
      !error && !warning && 'text-foreground bg-background border-muted',
    ]"
  >
    <slot />
  </div>
</template>
