<script setup lang="ts">
import { Switch as UuiSwitch } from '@/components/form/switch';
import ControlLayout from '@/forms/ControlLayout.vue';
import type { ControlElement } from '@jsonforms/core';
import { useJsonFormsControl } from '@jsonforms/vue';
import type { RendererProps } from '@jsonforms/vue';
import { computed } from 'vue';

const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);
const onChange = (checked: boolean) => {
  handleChange(control.value.path, checked);
};
const description = computed(() => props.uischema.options?.description);
</script>

<template>
  <ControlLayout v-if="control.visible" :label="control.label" :errors="control.errors">
    <p v-if="description" v-html="description" class="mb-2" />
    <UuiSwitch
      :id="control.id + '-input'"
      :name="control.path"
      :disabled="!control.enabled"
      :required="control.required"
      :modelValue="Boolean(control.data)"
      @update:modelValue="onChange"
    />
  </ControlLayout>
</template>
