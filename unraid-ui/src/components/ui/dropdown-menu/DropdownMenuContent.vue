<script setup lang="ts">
import useTeleport from '@/composables/useTeleport';
import { cn } from '@/lib/utils';
import { reactiveOmit } from '@vueuse/core';
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  useForwardPropsEmits,
  type DropdownMenuContentEmits,
  type DropdownMenuContentProps,
} from 'reka-ui';
import type { HTMLAttributes } from 'vue';

const props = withDefaults(
  defineProps<DropdownMenuContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    sideOffset: 4,
  }
);
const emits = defineEmits<DropdownMenuContentEmits>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const { teleportTarget } = useTeleport();
</script>

<template>
  <DropdownMenuPortal :to="teleportTarget">
    <DropdownMenuContent
      v-bind="forwarded"
      :class="
        cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 border-muted z-[103] min-w-32 overflow-hidden rounded-lg border p-1 shadow-md',
          props.class
        )
      "
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
