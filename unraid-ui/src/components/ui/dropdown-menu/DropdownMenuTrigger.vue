<script setup lang="ts">
import { DropdownMenuTrigger, useForwardProps, type DropdownMenuTriggerProps } from 'reka-ui';

const props = defineProps<DropdownMenuTriggerProps>();

const forwardedProps = useForwardProps(props);
</script>

<template>
  <DropdownMenuTrigger
    class="cursor-pointer outline-hidden data-[state=open]:cursor-pointer"
    v-bind="forwardedProps"
    as="span"
    tabindex="0"
  >
    <slot />
  </DropdownMenuTrigger>
</template>
