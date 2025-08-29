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
      class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60"
    />
    <DialogContent :class="sheetClass" v-bind="forwarded">
      <slot />
      <DialogClose
        class="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
      >
        <X class="text-muted-foreground h-4 w-4" />
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
