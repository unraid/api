<script lang="ts" setup>
import { cn } from '@/lib/utils';
import type { StepperSeparatorProps } from 'radix-vue';
import { StepperSeparator, useForwardProps } from 'radix-vue';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<StepperSeparatorProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <StepperSeparator
    v-bind="forwarded"
    :class="
      cn(
        'hidden md:block bg-muted md:w-[100px] md:h-[1px] md:my-0',
        // Disabled
        'group-data-[disabled]:bg-muted group-data-[disabled]:opacity-75',
        // Completed
        'group-data-[state=completed]:bg-accent-foreground',
        props.class
      )
    "
  />
</template>
