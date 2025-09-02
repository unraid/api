<script setup lang="ts">
import { TooltipTrigger, type TooltipTriggerProps } from 'reka-ui';

const props = withDefaults(defineProps<TooltipTriggerProps>(), {
  asChild: true,
});
</script>

<template>
  <TooltipTrigger v-bind="props">
    <slot />
  </TooltipTrigger>
</template>
