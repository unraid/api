<script setup lang="ts">
import { cn } from '@/lib/utils';
import { TabsContent, type TabsContentProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<TabsContentProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
</script>

<template>
  <TabsContent
    v-bind="delegatedProps"
    :class="
      cn(
        'ring-offset-background focus-visible:ring-ring mt-2 flex focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden',
        props.class
      )
    "
    class="data-[state=active]:flex data-[state=inactive]:hidden"
  >
    <slot />
  </TabsContent>
</template>
