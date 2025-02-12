<script setup lang="ts">
import { cn } from '@/lib/utils';

const props = withDefaults(defineProps<{ class?: string }>(), { class: '' });
</script>
<template>
  <div
    :class="cn('h-5 animate-pulse bg-gray-300 w-full', props.class)"
    role="progressbar"
    aria-label="Loading"
  />
</template>
