<script setup lang="ts">
withDefaults(defineProps<{
  error?: boolean,
  hover?: boolean;
  increasedPadding?: boolean;
  padding?: boolean;
  warning?: boolean;
}>(), {
  error: false,
  hover: true,
  increasedPadding: false,
  padding: true,
  warning: false,
});
</script>

<template>
  <div
    class="group/card text-left relative flex flex-col flex-1 border-2 border-solid rounded-md shadow-md "
    :class="[
      padding && 'p-4',
      increasedPadding && 'md:p-6',
      hover && 'hover:shadow-orange/50 transition-all',
      error && 'text-white bg-unraid-red border-unraid-red',
      warning && 'text-black bg-yellow-100 border-yellow-100',
      !error && !warning && 'text-beta bg-alpha border-gamma-opaque',
    ]"
  >
    <slot />
  </div>
</template>
