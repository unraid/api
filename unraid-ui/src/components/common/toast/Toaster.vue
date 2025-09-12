<script lang="ts" setup>
import { onMounted } from 'vue';
import { Toaster as Sonner, toast, type ToasterProps } from 'vue-sonner';
import 'vue-sonner/style.css';

// Accept theme as a prop, default to 'light' if not provided
interface Props extends ToasterProps {
  theme?: 'light' | 'dark' | 'system';
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
});

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

<style>
/* Override styles for Unraid environment */
[data-sonner-toast] [data-close-button] {
  min-width: inherit !important;
}

/* Override Unraid webgui docker icon styles on sonner containers */
[data-sonner-toast] [data-icon]:before,
[data-sonner-toast] .fa-docker:before {
  font-family: inherit !important;
  content: '' !important;
}
</style>
