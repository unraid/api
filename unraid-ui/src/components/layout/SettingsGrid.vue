<script setup lang="ts">
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: string;
}>();
</script>

<template>
  <div
    :class="
      cn(
        'grid grid-cols-1 md:grid-cols-[35%_1fr] [&>*:nth-child(odd)]:text-end gap-2 items-baseline md:pl-3 md:gap-x-10 md:gap-y-6',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
