<script setup lang="ts">
import SheetFooter from '@/components/common/sheet/SheetFooter.vue';
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@vueuse/core';
import { computed, type HTMLAttributes } from 'vue';

export interface ResponsiveModalFooterProps {
  class?: HTMLAttributes['class'];
  breakpoint?: string;
}

const props = withDefaults(defineProps<ResponsiveModalFooterProps>(), {
  breakpoint: '(max-width: 639px)', // sm breakpoint
});

const isMobile = useMediaQuery(props.breakpoint);

const footerClass = computed(() => {
  return cn('px-3 pb-3 flex-shrink-0', props.class);
});
</script>

<template>
  <SheetFooter v-if="isMobile" :class="footerClass">
    <slot />
  </SheetFooter>
  <DialogFooter v-else :class="footerClass">
    <slot />
  </DialogFooter>
</template>
