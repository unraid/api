<script setup lang="ts">
import { DialogClose, type DialogCloseProps } from 'reka-ui';

const props = defineProps<DialogCloseProps>();
</script>

<template>
  <DialogClose v-bind="props">
    <slot />
  </DialogClose>
</template>

<style>
/* Reset webgui button styles for dialog close buttons */
[role='dialog'] button[type='button'],
button[aria-label*='close' i],
button[aria-label*='dismiss' i] {
  /* Reset ALL webgui button styles using !important where needed */
  all: unset !important;

  /* Re-apply necessary styles after reset */
  display: inline-flex !important;
  font-family: inherit !important;
  font-size: inherit !important;
  font-weight: inherit !important;
  line-height: inherit !important;
  cursor: pointer !important;
  box-sizing: border-box !important;

  /* Reset any webgui CSS variables */
  --button-border: none !important;
  --button-text-color: inherit !important;
  --button-background: transparent !important;
  --button-background-size: auto !important;
}
</style>
