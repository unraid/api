<script lang="ts" setup>
import { onMounted } from 'vue';
import { Toaster as Sonner, toast, type ToasterProps } from 'vue-sonner';

const props = defineProps<ToasterProps>();

onMounted(() => {
  globalThis.toast = toast;
});
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :toast-options="{
      classes: {
        toast:
          'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        error: '[&>div>svg]:fill-unraid-red-500',
        warning: '[&>div>svg]:fill-yellow-500',
        info: '[&>div>svg]:fill-blue-500',
      },
    }"
  />
</template>
