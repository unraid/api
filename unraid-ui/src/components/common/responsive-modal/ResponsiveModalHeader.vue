<script setup lang="ts">
import SheetHeader from '@/components/common/sheet/SheetHeader.vue';
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@vueuse/core';
import { computed, type HTMLAttributes } from 'vue';

export interface ResponsiveModalHeaderProps {
  class?: HTMLAttributes['class'];
  breakpoint?: string;
}

const props = withDefaults(defineProps<ResponsiveModalHeaderProps>(), {
  breakpoint: '(max-width: 639px)', // sm breakpoint
});

const isMobile = useMediaQuery(props.breakpoint);

const headerClass = computed(() => {
  return cn('px-6 pt-6 flex-shrink-0', props.class);
});
</script>

<template>
  <SheetHeader v-if="isMobile" :class="headerClass">
    <slot />
  </SheetHeader>
  <DialogHeader v-else :class="headerClass">
    <slot />
  </DialogHeader>
</template>
