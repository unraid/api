<script setup lang="ts">
import { cn } from '@/lib/utils';
import { TabsList, type TabsListProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<TabsListProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <TabsList
    v-bind="delegatedProps"
    :class="
      cn(
        'bg-input text-foreground inline-flex items-center justify-center rounded-md p-1.5',
        props.class
      )
    "
  >
    <slot />
  </TabsList>
</template>
