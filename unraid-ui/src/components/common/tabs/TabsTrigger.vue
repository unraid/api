<script setup lang="ts">
import { cn } from '@/lib/utils';
import { TabsTrigger, useForwardProps, type TabsTriggerProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <TabsTrigger
    v-bind="forwardedProps"
    as="span"
    tabindex="0"
    :class="
      cn(
        'ring-offset-background focus-visible:ring-ring inline-flex cursor-pointer items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors select-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50',
        'hover:bg-accent hover:text-accent-foreground',
        'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:hover:bg-primary/90',
        props.class
      )
    "
  >
    <slot />
  </TabsTrigger>
</template>
