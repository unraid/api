<script setup lang="ts">
import { DialogRoot, useForwardPropsEmits, type DialogRootEmits, type DialogRootProps } from 'reka-ui';
import { onUnmounted, ref } from 'vue';

const MOBILE_VIEWPORT = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0' as const;

const props = defineProps<DialogRootProps & { class?: string }>();
const emits = defineEmits<DialogRootEmits>();

const getViewport = (): string => {
  return document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? 'width=1300';
};
const updateViewport = (viewport: string): void => {
  if (window.innerWidth < 500) {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute('content', viewport);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = viewport;
      document.head.appendChild(meta);
    }
  }
};

const forwarded = useForwardPropsEmits(props, emits) as any;
const initialViewport = ref(getViewport());
const openListener = (opened: boolean) => {
  if (opened) {
    updateViewport(MOBILE_VIEWPORT);
  } else {
    updateViewport(initialViewport.value);
  }
};

onUnmounted(() => {
  updateViewport(initialViewport.value);
});
</script>

<template>
  <DialogRoot v-bind="forwarded" @update:open="openListener">
    <slot />
  </DialogRoot>
</template>
