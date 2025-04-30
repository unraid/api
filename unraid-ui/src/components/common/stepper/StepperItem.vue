<script lang="ts" setup>
import { cn } from '@/lib/utils';
import type { StepperItemProps } from 'reka-ui';
import { StepperItem, useForwardProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<StepperItemProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <StepperItem
    v-slot="slotProps"
    v-bind="forwarded"
    :class="
      cn(
        'flex flex-col items-start gap-1',
        'md:flex-row md:items-center md:gap-2',
        'group transition-all duration-200',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-80',
        props.class
      )
    "
  >
    <slot v-bind="slotProps" />
  </StepperItem>
</template>
