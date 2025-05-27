<script lang="ts" setup>
import { jsonFormsRenderers } from '@/forms/renderers';
import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsI18nState,
  JsonFormsRendererRegistryEntry,
  JsonFormsUISchemaRegistryEntry,
  JsonSchema,
  Middleware,
  UISchemaElement,
  ValidationMode,
} from '@jsonforms/core';
import { JsonForms as BaseJsonForms } from '@jsonforms/vue';
import type { Ref } from 'vue';

const props = withDefaults(
  defineProps<{
    schema: JsonSchema;
    uischema?: UISchemaElement;
    data: Ref<Record<string, unknown>> | Record<string, unknown>;
    renderers?: JsonFormsRendererRegistryEntry[];
    cells?: JsonFormsCellRendererRegistryEntry[];
    config?: unknown;
    readonly?: boolean;
    uischemas?: JsonFormsUISchemaRegistryEntry[];
    validationMode?: ValidationMode;
    middleware?: Middleware;
    i18n?: JsonFormsI18nState;
  }>(),
  {
    renderers: () => jsonFormsRenderers,
    config: () => ({ restrict: false, trim: false, useDefaults: true }),
    validationMode: 'ValidateAndShow',
  }
);
const emit = defineEmits(['change']);

function onChange(event: unknown): void {
  emit('change', event);
}
</script>

<template>
  <BaseJsonForms
    :schema="props.schema"
    :uischema="props.uischema"
    :data="props.data"
    :renderers="props.renderers"
    :cells="props.cells"
    :config="props.config"
    :readonly="props.readonly"
    :uischemas="props.uischemas"
    :validation-mode="props.validationMode"
    :ajv="undefined"
    :middleware="props.middleware"
    :i18n="props.i18n"
    :additional-errors="undefined"
    @change="onChange"
  />
</template>
