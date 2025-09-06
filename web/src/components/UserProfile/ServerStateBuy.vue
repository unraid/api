<script setup lang="ts">
import { Button } from '@unraid/ui';
</script>

<template>
  <Button
    variant="ghost"
    class="hover:border-orange-dark focus:border-orange-dark h-auto border-t-0 border-r-0 border-b-2 border-l-0 border-transparent p-0 text-xs font-semibold transition-colors duration-150 ease-in-out focus:outline-hidden"
  >
    <slot />
  </Button>
</template>
