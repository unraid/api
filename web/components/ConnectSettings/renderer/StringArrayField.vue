<script setup lang="ts">
import { computed } from 'vue';
import { Button, Input } from '@unraid/ui';
import { useJsonFormsControl } from '@jsonforms/vue';
import type { ControlElement } from '@jsonforms/core';
import type { RendererProps } from '@jsonforms/vue';

import ControlLayout from './ControlLayout.vue';

const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);

const items = computed({
  get: () => {
    const data = control.value.data ?? [];
    return Array.isArray(data) ? data : [];
  },
  set: (newValue: string[]) => {
    handleChange(control.value.path, newValue);
  },
});

const addItem = () => {
  items.value = [...items.value, ''];
};

const removeItem = (index: number) => {
  const newItems = [...items.value];
  newItems.splice(index, 1);
  items.value = newItems;
};

const updateItem = (index: number, newValue: string) => {
  const newItems = [...items.value];
  newItems[index] = newValue;
  items.value = newItems;
};

const inputType = computed(() => control.value.uischema?.options?.inputType ?? 'text');
const placeholder = computed(() => control.value.uischema?.options?.placeholder ?? '');
</script>

<template>
  <ControlLayout v-if="control.visible" :label="control.label" :errors="control.errors">
    <div class="space-y-4">
      <p v-if="control.description">{{ control.description }}</p>
      <div v-for="(item, index) in items" :key="index" class="flex gap-2">
        <Input
          :type="inputType"
          :model-value="item"
          :placeholder="placeholder"
          class="flex-1"
          @update:model-value="(value: string) => updateItem(index, value)"
        />
        <Button variant="outline" @click="() => removeItem(index)">Remove</Button>
      </div>
      <Button variant="outline" @click="addItem">Add Item</Button>
    </div>
  </ControlLayout>
</template> 