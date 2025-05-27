<script setup lang="ts">
import { DialogClose, useForwardPropsEmits, type DialogCloseProps } from 'reka-ui';

const props = defineProps<DialogCloseProps>();
const emits = defineEmits([]);

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DialogClose v-bind="forwarded">
    <slot />
  </DialogClose>
</template>
