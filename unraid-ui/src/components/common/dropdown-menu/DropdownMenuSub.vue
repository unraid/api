<script setup lang="ts">
import {
  DropdownMenuSub,
  useForwardPropsEmits,
  type DropdownMenuSubEmits,
  type DropdownMenuSubProps,
} from 'reka-ui';

const props = defineProps<DropdownMenuSubProps>();
const emits = defineEmits<DropdownMenuSubEmits>();

const forwarded = useForwardPropsEmits<DropdownMenuSubProps, 'update:open'>(props, emits);
</script>

<template>
  <DropdownMenuSub v-bind="forwarded">
    <slot />
  </DropdownMenuSub>
</template>
