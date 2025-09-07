<script setup lang="ts">
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';

import type { HTMLAttributes } from 'vue';

defineOptions({
  inheritAttrs: false,
});

export interface ResponsiveModalProps {
  modelValue: boolean;
  title?: string;
  description?: string;
  // Modal/Slideover class
  modalClass?: HTMLAttributes['class'];
  // Content class
  contentClass?: HTMLAttributes['class'];
  // Slideover side (for USlideover)
  side?: 'left' | 'right';
  // Breakpoint for switching between mobile/desktop
  breakpoint?: string;
}

const props = withDefaults(defineProps<ResponsiveModalProps>(), {
  side: 'right',
  breakpoint: '(max-width: 639px)', // sm breakpoint
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const isMobile = useMediaQuery(props.breakpoint);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <!-- Mobile: Use Slideover -->
  <USlideover
    v-if="isMobile"
    v-model:open="isOpen"
    v-bind="$attrs"
    :side="side"
    :title="title"
    :description="description"
    :class="modalClass"
  >
    <template #body>
      <div :class="contentClass">
        <slot />
      </div>
    </template>
  </USlideover>

  <!-- Desktop: Use Modal -->
  <UModal
    v-else
    v-model:open="isOpen"
    v-bind="$attrs"
    :title="title"
    :description="description"
    :class="modalClass"
  >
    <template #body>
      <div :class="contentClass">
        <slot />
      </div>
    </template>
  </UModal>
</template>
