<script lang="ts" setup>
import { Toaster } from '@unraid/ui';

defineProps<{
  position: 'top-center' | 'top-right' | 'top-left' | 'bottom-center' | 'bottom-right' | 'bottom-left';
}>();
</script>

<template>
  <Toaster rich-colors close-button :position="position" />
</template>
