<script setup lang="ts">
import { TabsRoot, useForwardPropsEmits } from 'reka-ui';
import type { TabsRootEmits, TabsRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

const props = defineProps<TabsRootProps>();
const emits = defineEmits<TabsRootEmits>();

const forwarded = useForwardPropsEmits(props, emits) as TabsRootProps & HTMLAttributes;
</script>

<template>
  <TabsRoot v-bind="forwarded">
    <slot />
  </TabsRoot>
</template>
