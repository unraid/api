<script setup lang="ts">
import { DropdownMenuTrigger, useForwardProps, type DropdownMenuTriggerProps } from 'reka-ui';

const props = defineProps<DropdownMenuTriggerProps>();

const forwardedProps = useForwardProps(props);
</script>

<template>
  <DropdownMenuTrigger
    class="outline-hidden cursor-pointer data-[state=open]:cursor-pointer"
    v-bind="forwardedProps"
  >
    <slot />
  </DropdownMenuTrigger>
</template>
