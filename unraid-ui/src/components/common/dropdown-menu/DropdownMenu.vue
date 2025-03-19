<script setup lang="ts">
import {
  DropdownMenuRoot,
  useForwardPropsEmits,
  type DropdownMenuRootEmits,
  type DropdownMenuRootProps,
} from 'reka-ui';

const props = defineProps<DropdownMenuRootProps>();
const emits = defineEmits<DropdownMenuRootEmits>();

const forwarded = useForwardPropsEmits<DropdownMenuRootProps, 'update:open'>(props, emits);
</script>

<template>
  <DropdownMenuRoot v-bind="forwarded">
    <slot />
  </DropdownMenuRoot>
</template>
