<script setup lang="ts">
import { Button } from '@/components/common/button';
import { Input } from '@/components/form/input';
import type { ControlElement } from '@jsonforms/core';
import { useJsonFormsControl } from '@jsonforms/vue';
import type { RendererProps } from '@jsonforms/vue';
import { computed } from 'vue';

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
  <div class="space-y-4">
    <div v-for="(item, index) in items" :key="index" class="flex gap-2">
      <Input
        :type="inputType"
        :model-value="item"
        :placeholder="placeholder"
        :disabled="!control.enabled"
        class="flex-1"
        @update:model-value="(value) => updateItem(index, String(value))"
      />
      <Button
        variant="ghost"
        class="rounded underline underline-offset-4"
        :disabled="!control.enabled"
        @click="() => removeItem(index)"
      >
        Remove
      </Button>
    </div>
    <Button
      variant="outline"
      size="md"
      class="rounded-sm text-sm"
      :disabled="!control.enabled"
      @click="addItem"
    >
      Add Item
    </Button>
  </div>
</template>
