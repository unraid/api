<script setup lang="ts">
withDefaults(defineProps<{
  hover?: boolean;
  increasedPadding?: boolean;
  padding?: boolean;
}>(), {
  hover: true,
  increasedPadding: false,
  padding: true,
});
</script>

<template>
  <div
    class="group/card text-left relative flex flex-col flex-1 text-beta bg-alpha border-2 border-solid border-gamma-opaque rounded-md shadow-md "
    :class="[
      padding && 'p-4',
      increasedPadding && 'md:p-6',
      hover && 'hover:shadow-orange/50 transition-all',
    ]"
  >
    <slot></slot>
  </div>
</template>
