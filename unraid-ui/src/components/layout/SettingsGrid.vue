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
        'grid grid-cols-1 gap-2 md:grid-cols-settings items-baseline md:pl-3 md:gap-y-6 md:[&>*:nth-child(odd)]:text-end md:[&>*:nth-child(even)]:ml-10',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
