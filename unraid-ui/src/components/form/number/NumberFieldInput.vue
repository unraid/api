<script setup lang="ts">
import { cn } from '@/lib/utils';
import { NumberFieldInput as RekaNumberFieldInput } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <RekaNumberFieldInput
    data-slot="input"
    :class="
      cn(
        'flex h-10 w-full rounded-md border border-input bg-background py-2 text-sm text-center ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
  />
</template>
