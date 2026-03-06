<script setup lang="ts">
import Button from '@/components/common/button/Button.vue';
import useTeleport from '@/composables/useTeleport';
import { cn } from '@/lib/utils';
import { reactiveOmit } from '@vueuse/core';
import { X } from 'lucide-vue-next';
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
  type DialogContentEmits,
  type DialogContentProps,
} from 'reka-ui';
import type { HTMLAttributes } from 'vue';

const props = defineProps<
  DialogContentProps & {
    class?: HTMLAttributes['class'];
    showCloseButton?: boolean;
    to?: string | HTMLElement;
  }
>();
const emits = defineEmits<DialogContentEmits>();

const delegatedProps = reactiveOmit(props, 'class', 'showCloseButton', 'to');

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const { teleportTarget } = useTeleport();
</script>

<template>
  <DialogPortal :to="props.to || teleportTarget || 'body'">
    <DialogOverlay
      class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80"
    />
    <DialogContent
      v-bind="forwarded"
      :class="
        cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 border-muted fixed top-1/2 left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border p-6 shadow-lg duration-200',
          // Only apply zoom animation if not fullscreen
          !props.class?.includes('min-h-screen') &&
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          // Apply slide-up animation for fullscreen modals
          props.class?.includes('min-h-screen') &&
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          props.class
        )
      "
    >
      <slot />

      <DialogClose v-if="showCloseButton !== false" as-child class="absolute top-4 right-6 z-10">
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 rounded-sm opacity-70 transition-opacity hover:opacity-100"
          aria-label="Close"
        >
          <X class="h-4 w-4" />
        </Button>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
