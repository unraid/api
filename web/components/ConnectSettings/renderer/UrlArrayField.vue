<script setup lang="ts">
import { computed } from 'vue';
import { Button, Input } from '@unraid/ui';
import { useJsonFormsControl } from '@jsonforms/vue';
import type { ControlElement } from '@jsonforms/core';
import type { RendererProps } from '@jsonforms/vue';

import ControlLayout from './ControlLayout.vue';

const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);

const urls = computed({
  get: () => {
    const data = control.value.data ?? [];
    return Array.isArray(data) ? data : [];
  },
  set: (newValue: { url: string }[]) => {
    handleChange(control.value.path, newValue);
  },
});

const addUrl = () => {
  urls.value = [...urls.value, { url: '' }];
};

const removeUrl = (index: number) => {
  const newUrls = [...urls.value];
  newUrls.splice(index, 1);
  urls.value = newUrls;
};

const updateUrl = (index: number, newUrl: string) => {
  const newUrls = [...urls.value];
  newUrls[index] = { url: newUrl };
  urls.value = newUrls;
};
</script>

<template>
  <ControlLayout v-if="control.visible" :label="control.label" :errors="control.errors">
    <div class="space-y-4">
      <p v-if="control.description" class="text-sm text-gray-600">{{ control.description }}</p>
      <div v-for="(item, index) in urls" :key="index" class="flex gap-2">
        <Input
          type="url"
          :model-value="item.url"
          placeholder="https://example.com"
          class="flex-1"
          @update:model-value="(value: string) => updateUrl(index, value)"
        />
        <Button variant="outline" @click="() => removeUrl(index)">Remove</Button>
      </div>
      <Button variant="outline" @click="addUrl">Add URL</Button>
    </div>
  </ControlLayout>
</template> 