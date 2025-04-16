<script setup lang="ts">
import {
  ComboboxRoot,
  useForwardPropsEmits,
  type ComboboxRootEmits,
  type ComboboxRootProps,
} from 'reka-ui';

const props = defineProps<ComboboxRootProps>();
const emits = defineEmits<ComboboxRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <ComboboxRoot v-bind="forwarded">
    <slot />
  </ComboboxRoot>
</template>
