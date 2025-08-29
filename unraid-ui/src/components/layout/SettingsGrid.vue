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
        'grid grid-cols-1 items-baseline gap-2 md:grid-cols-[35%_1fr] md:gap-x-3 md:gap-y-6 [&>*:nth-child(odd)]:text-end',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
