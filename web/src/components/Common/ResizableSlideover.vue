<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useEventListener, useSupported, useWindowSize } from '@vueuse/core';

import type { CSSProperties } from 'vue';

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    iframeUrl?: string;
    buttonLabel?: string;
    wrapperClass?: string;
    minWidth?: number;
    maxWidth?: number;
    defaultWidth?: number;
  }>(),
  {
    description: '',
    iframeUrl: undefined,
    buttonLabel: '',
    wrapperClass: '',
    minWidth: 400,
    maxWidth: 1200,
    defaultWidth: 800,
  }
);

const open = defineModel<boolean>('open', { default: false });

const { width: windowWidth } = useWindowSize();
const sidebarWidth = ref(props.defaultWidth);
const isResizing = ref(false);

const clampSidebarWidth = (desired: number, viewport: number | null) => {
  const safeViewport = viewport || props.defaultWidth;
  const maxAllowed = Math.min(props.maxWidth, safeViewport);
  const minAllowed = Math.min(props.minWidth, safeViewport);
  return Math.min(Math.max(desired, minAllowed), maxAllowed);
};

const startResize = (e: MouseEvent) => {
  isResizing.value = true;
  if (import.meta.client) {
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }
  e.preventDefault();
  e.stopPropagation();
};

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return;
  const viewportWidth = window.innerWidth;
  const newWidth = viewportWidth - e.clientX;
  sidebarWidth.value = clampSidebarWidth(newWidth, viewportWidth);
};

const stopResize = () => {
  if (!isResizing.value) return;
  isResizing.value = false;
  if (import.meta.client) {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
};

useEventListener('mousemove', handleResize);
useEventListener('mouseup', stopResize);

watch(
  windowWidth,
  (viewport) => {
    if (!viewport) return;
    const clamped = clampSidebarWidth(sidebarWidth.value, viewport);
    if (clamped !== sidebarWidth.value) {
      sidebarWidth.value = clamped;
    }
  },
  { immediate: true }
);

const slideoverUi = computed(() => ({
  content: 'flex flex-col overflow-hidden',
  body: 'relative flex flex-1 flex-col overflow-hidden p-0 sm:p-0',
}));

const slideoverContent = computed<Record<string, unknown>>(() => ({
  class: 'max-w-none overflow-hidden',
  style: {
    width: `${sidebarWidth.value}px`,
    maxWidth: `${Math.min(props.maxWidth, windowWidth.value || props.maxWidth)}px`,
    minWidth: `${Math.min(props.minWidth, windowWidth.value || props.minWidth)}px`,
  } as CSSProperties,
}));

const supportsCredentiallessIframe = useSupported(
  () => typeof HTMLIFrameElement !== 'undefined' && 'credentialless' in HTMLIFrameElement.prototype
);
</script>

<template>
  <div :class="wrapperClass">
    <USlideover
      v-model:open="open"
      :title="title"
      :description="description"
      :ui="slideoverUi"
      :content="slideoverContent"
      side="right"
    >
      <template #body>
        <div class="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">
          <!-- Resize handle -->
          <div
            class="hover:bg-primary/20 absolute top-0 left-0 z-10 h-full w-2 cursor-ew-resize bg-transparent transition-colors"
            @mousedown="startResize"
          >
            <div
              class="bg-primary/40 hover:bg-primary/70 absolute top-1/2 left-1/2 h-16 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors"
            />
          </div>

          <!-- Pointer overlay while resizing -->
          <div v-if="isResizing" class="absolute inset-0 z-20 cursor-ew-resize bg-transparent" />

          <!-- Content: iframe or slot -->
          <iframe
            v-if="iframeUrl"
            :src="iframeUrl"
            class="h-full w-full min-w-0 flex-1 border-0"
            :title="title"
            referrerpolicy="no-referrer"
            :credentialless="supportsCredentiallessIframe ? true : undefined"
          />
          <div v-else class="h-full w-full min-w-0 flex-1 overflow-auto">
            <slot />
          </div>
        </div>
      </template>
    </USlideover>

    <UButton
      v-if="buttonLabel"
      variant="soft"
      color="neutral"
      size="md"
      leading-icon="i-heroicons-question-mark-circle"
      :label="buttonLabel"
      @click="open = true"
    />
  </div>
</template>
