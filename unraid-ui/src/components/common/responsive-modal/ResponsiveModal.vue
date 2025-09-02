<script setup lang="ts">
import type { SheetVariants } from '@/components/common/sheet/sheet.variants';
import Sheet from '@/components/common/sheet/Sheet.vue';
import SheetContent from '@/components/common/sheet/SheetContent.vue';
import DialogContent from '@/components/ui/dialog/DialogContent.vue';
import DialogRoot from '@/components/ui/dialog/DialogRoot.vue';
import { useMediaQuery } from '@vueuse/core';
import { computed, type HTMLAttributes } from 'vue';

export interface ResponsiveModalProps {
  open: boolean;
  showCloseButton?: boolean;
  // Sheet-specific props
  sheetSide?: SheetVariants['side'];
  sheetPadding?: SheetVariants['padding'];
  sheetClass?: HTMLAttributes['class'];
  // Dialog-specific props
  dialogClass?: HTMLAttributes['class'];
  // Breakpoint for switching between mobile/desktop
  breakpoint?: string;
}

const props = withDefaults(defineProps<ResponsiveModalProps>(), {
  open: false,
  showCloseButton: true,
  sheetSide: 'bottom',
  sheetPadding: 'none',
  breakpoint: '(max-width: 639px)', // sm breakpoint
});

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const isMobile = useMediaQuery(props.breakpoint);

const handleOpenChange = (value: boolean) => {
  emit('update:open', value);
};

// Compute final classes for sheet and dialog
const finalSheetClass = computed(() => {
  const baseClass = 'h-screen flex flex-col';
  return props.sheetClass ? `${baseClass} ${props.sheetClass}` : baseClass;
});

const finalDialogClass = computed(() => {
  const baseClass = 'flex flex-col';
  return props.dialogClass ? `${baseClass} ${props.dialogClass}` : baseClass;
});
</script>

<template>
  <!-- Mobile: Use Sheet -->
  <Sheet v-if="isMobile" :open="open" @update:open="handleOpenChange">
    <SheetContent :side="sheetSide" :padding="sheetPadding" :class="finalSheetClass">
      <slot />
    </SheetContent>
  </Sheet>

  <!-- Desktop: Use Dialog -->
  <DialogRoot v-else :open="open" @update:open="handleOpenChange">
    <DialogContent :class="finalDialogClass" :show-close-button="showCloseButton">
      <slot />
    </DialogContent>
  </DialogRoot>
</template>
