<script setup lang="ts">
withDefaults(defineProps<{ increasedPadding?: boolean }>(), {
  increasedPadding: false,
});
</script>

<template>
  <div
    class="group/card p-4 text-left relative flex flex-col flex-1 text-beta bg-alpha border-2 border-solid border-gamma-opaque rounded-md shadow-md hover:shadow-orange/50 transition-all"
    :class="increasedPadding && 'md:p-6'"
  >
    <slot></slot>
  </div>
</template>
