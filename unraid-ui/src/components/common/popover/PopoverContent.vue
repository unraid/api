<script setup lang="ts">
import { cn } from '@/lib/utils';
import {
  PopoverArrow,
  PopoverContent,
  PopoverPortal,
  useForwardPropsEmits,
  type PopoverContentEmits,
  type PopoverContentProps,
} from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<PopoverContentProps & { class?: HTMLAttributes['class'] }>(), {
  align: 'center',
  sideOffset: 4,
});
const emits = defineEmits<PopoverContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="
        cn(
          'z-50 w-72 rounded-md bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          props.class
        )
      "
    >
      <slot />
      <PopoverArrow :rounded="true" class="fill-popover" />
    </PopoverContent>
  </PopoverPortal>
</template>
