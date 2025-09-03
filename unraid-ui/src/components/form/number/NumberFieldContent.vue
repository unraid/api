<script setup lang="ts">
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <!-- Add corresponding padding when increment/decrement buttons are present -->
  <div
    :class="
      cn(
        'relative has-data-[slot=decrement]:*:data-[slot=input]:pl-5 has-data-[slot=increment]:*:data-[slot=input]:pr-5',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
