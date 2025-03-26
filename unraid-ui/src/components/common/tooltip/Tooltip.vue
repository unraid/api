<script setup lang="ts">
import {
  TooltipRoot,
  useForwardPropsEmits,
  type TooltipRootEmits,
  type TooltipRootProps,
} from 'reka-ui';
import type { HTMLAttributes } from 'vue';

const props = defineProps<TooltipRootProps>();
const emits = defineEmits<TooltipRootEmits>();

const forwarded = useForwardPropsEmits(props, emits) as TooltipRootProps & HTMLAttributes;
</script>

<template>
  <TooltipRoot v-bind="forwarded">
    <slot />
  </TooltipRoot>
</template>
