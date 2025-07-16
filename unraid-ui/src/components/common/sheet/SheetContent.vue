<script setup lang="ts">
import { sheetVariants, type SheetVariants } from '@/components/common/sheet/sheet.variants';
import useTeleport from '@/composables/useTeleport';
import { cn } from '@/lib/utils';
import { X } from 'lucide-vue-next';
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
  type DialogContentEmits,
} from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

export interface SheetContentProps {
  side?: SheetVariants['side'];
  padding?: SheetVariants['padding'];
  class?: HTMLAttributes['class'];
  disabled?: boolean;
  forceMount?: boolean;
  to?: string | HTMLElement;
}

const { teleportTarget } = useTeleport();

const props = withDefaults(defineProps<SheetContentProps>(), {
  side: 'right',
  padding: 'md',
});

const emits = defineEmits<DialogContentEmits>();

const sheetClass = computed(() => {
  return cn(sheetVariants({ side: props.side, padding: props.padding }), props.class);
});

const delegatedProps = computed(() => {
  const { class: _, side, padding, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <DialogPortal :disabled="disabled" :force-mount="forceMount" :to="teleportTarget">
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent :class="sheetClass" v-bind="forwarded">
      <slot />
      <DialogClose
        class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
      >
        <X class="w-4 h-4 text-muted-foreground" />
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
