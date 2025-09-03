<script lang="ts" setup>
import { cn } from '@/lib/utils';
import type { StepperIndicatorProps } from 'reka-ui';
import { StepperIndicator, useForwardProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<StepperIndicatorProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <StepperIndicator
    v-bind="forwarded"
    :class="
      cn(
        'text-muted-foreground/50 inline-flex h-10 w-10 items-center justify-center rounded-full',
        // Disabled
        'group-data-disabled:text-muted-foreground group-data-disabled:opacity-50',
        // Active
        'group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground',
        // Completed
        'group-data-[state=completed]:bg-accent group-data-[state=completed]:text-accent-foreground',
        props.class
      )
    "
  >
    <slot />
  </StepperIndicator>
</template>
