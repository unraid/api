<script setup lang="ts">
import { cn } from '@/lib/utils';

const props = withDefaults(defineProps<{ class?: string }>(), { class: '' });
</script>
<template>
  <!-- adapted from https://tw-elements.com/docs/standard/components/spinners/ -->
  <div
    :class="
      cn(
        'text-primary inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
        props.class
      )
    "
    role="status"
  >
    <span class="sr-only">Loading...</span>
  </div>
</template>
