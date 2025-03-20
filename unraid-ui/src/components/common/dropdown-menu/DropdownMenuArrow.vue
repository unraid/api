<script setup lang="ts">
import { cn } from '@/lib/utils';
import {
  DropdownMenuArrow as RekaDropdownMenuArrow,
  useForwardProps,
  type DropdownMenuArrowProps,
} from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<DropdownMenuArrowProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <RekaDropdownMenuArrow
    v-bind="forwardedProps"
    :class="
      cn(
        'fill-popover data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        props.class
      )
    "
  />
</template>
