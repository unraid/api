<script setup lang="ts">
import { cn } from '@/lib/utils';
import {
  ComboboxInput,
  useForwardPropsEmits,
  type ComboboxInputEmits,
  type ComboboxInputProps,
} from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<
  ComboboxInputProps & {
    class?: HTMLAttributes['class'];
  }
>();

const emits = defineEmits<ComboboxInputEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ComboboxInput
    v-bind="forwarded"
    :class="
      cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
  >
    <slot />
  </ComboboxInput>
</template>
