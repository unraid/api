<script lang="ts" setup>
import { Toaster } from '@unraid/ui';

withDefaults(
  defineProps<{
    position?:
      | 'top-center'
      | 'top-right'
      | 'top-left'
      | 'bottom-center'
      | 'bottom-right'
      | 'bottom-left';
  }>(),
  {
    position: 'top-right',
  }
);
</script>

<template>
  <Toaster rich-colors close-button :position="position" />
</template>
