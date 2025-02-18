<script lang="ts" setup>
import { cn } from '@/lib/utils';
import type { StepperItemProps } from 'radix-vue';
import { StepperItem, useForwardProps } from 'radix-vue';
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
      cn('md:flex md:items-center md:gap-2 group data-[disabled]:pointer-events-none', props.class)
    "
  >
    <slot v-bind="slotProps" />
  </StepperItem>
</template>
