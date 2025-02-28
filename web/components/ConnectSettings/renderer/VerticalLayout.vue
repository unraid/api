<!-- VerticalLayout.vue -->
<script lang="ts" setup>
import { Label } from '@unraid/ui';
import { DispatchRenderer, type RendererProps } from '@jsonforms/vue';
import { computed } from 'vue';
import type { VerticalLayout } from '@jsonforms/core';


const props = defineProps<RendererProps<VerticalLayout>>();

const elements = computed(() => {
  return props.uischema.elements || [];
});
</script>

<template>
  <div class="grid grid-cols-12 items-baseline gap-6 [&>*:nth-child(odd)]:text-end [&>*:nth-child(odd)]:col-span-4 [&>*:nth-child(even)]:col-span-8">
    <template v-for="(element, index) in elements" :key="index">
      <Label v-if="element.label">{{ element.label }}</Label>
      <DispatchRenderer
        :schema="props.schema"
        :uischema="element"
        :path="props.path"
        :enabled="props.enabled"
        :renderers="props.renderers"
        :cells="props.cells"
      />
    </template>
  </div>
</template> 