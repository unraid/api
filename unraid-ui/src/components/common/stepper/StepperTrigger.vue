<script lang="ts" setup>
import { cn } from '@/lib/utils';
import type { StepperTriggerProps } from 'reka-ui';
import { StepperTrigger, useForwardProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<StepperTriggerProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <StepperTrigger
    v-bind="forwarded"
    :class="
      cn(
        'flex flex-col items-center justify-center text-center gap-2 rounded-md w-full md:w-auto',
        props.class
      )
    "
  >
    <slot />
  </StepperTrigger>
</template>
