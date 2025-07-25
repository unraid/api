<script setup lang="ts">
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
  DialogContentProps & { class?: HTMLAttributes['class']; showCloseButton?: boolean } & {
    to?: string | HTMLElement;
  }
>();

const emits = defineEmits<DialogContentEmits>();

const delegatedProps = reactiveOmit(props, 'class', 'showCloseButton', 'to');

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const { teleportTarget } = useTeleport();
</script>

<template>
  <DialogPortal :to="props.to || teleportTarget">
    <DialogOverlay
      class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    >
      <DialogContent
        :class="
          cn(
            'relative z-50 grid w-full max-w-lg my-8 gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg md:w-full',
            props.class
          )
        "
        v-bind="forwarded"
        @pointer-down-outside="
          (event) => {
            const originalEvent = event.detail.originalEvent;
            const target = originalEvent.target as HTMLElement;
            if (
              originalEvent.offsetX > target.clientWidth ||
              originalEvent.offsetY > target.clientHeight
            ) {
              event.preventDefault();
            }
          }
        "
      >
        <slot />

        <DialogClose
          v-if="showCloseButton !== false"
          class="absolute top-3 right-3 p-0.5 transition-colors rounded-md hover:bg-secondary"
        >
          <X class="w-4 h-4" />
          <span class="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </DialogOverlay>
  </DialogPortal>
</template>
