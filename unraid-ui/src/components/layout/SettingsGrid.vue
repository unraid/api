<script setup lang="ts">
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: string;
}>();
</script>

<template>
  <div
    :class="cn('settings-grid grid gap-2 items-baseline md:pl-3 md:gap-x-10 md:gap-y-6', props.class)"
  >
    <slot />
  </div>
</template>

<style>
.settings-grid {
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .settings-grid {
    grid-template-columns: 35% 1fr;
  }

  .settings-grid > *:nth-child(odd) {
    text-align: end;
  }
}
</style>
