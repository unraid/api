<script setup lang="ts">
import SheetTitle from '@/components/common/sheet/SheetTitle.vue';
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue';
import { useMediaQuery } from '@vueuse/core';
import { type HTMLAttributes } from 'vue';

export interface ResponsiveModalTitleProps {
  class?: HTMLAttributes['class'];
  breakpoint?: string;
}

const props = withDefaults(defineProps<ResponsiveModalTitleProps>(), {
  breakpoint: '(max-width: 639px)', // sm breakpoint
});

const isMobile = useMediaQuery(props.breakpoint);
</script>

<template>
  <SheetTitle v-if="isMobile" :class="props.class">
    <slot />
  </SheetTitle>
  <DialogTitle v-else :class="props.class">
    <slot />
  </DialogTitle>
</template>
