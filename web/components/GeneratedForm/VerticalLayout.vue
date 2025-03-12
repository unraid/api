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
  <div class="grid grid-cols-settings items-baseline gap-y-6">
    <template v-for="(element, index) in elements" :key="index">
      <Label v-if="element.label" class="text-end">{{ element.label }}</Label>
      <DispatchRenderer
        class="ml-10"
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