<script setup lang="ts">
import Button from '@/components/common/button/Button.vue';
import { sheetVariants, type SheetVariants } from '@/components/common/sheet/sheet.variants';
import SheetClose from '@/components/common/sheet/SheetClose.vue';
import useTeleport from '@/composables/useTeleport';
import { cn } from '@/lib/utils';
import { X } from 'lucide-vue-next';
import {
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
      <SheetClose as="span" class="absolute top-[max(1rem,env(safe-area-inset-top))] right-4">
        <Button variant="ghost" size="sm" class="h-auto w-auto p-1">
          <X class="h-4 w-4" />
        </Button>
      </SheetClose>
    </DialogContent>
  </DialogPortal>
</template>
