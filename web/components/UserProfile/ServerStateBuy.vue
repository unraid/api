<script setup lang="ts">
import { Button } from '@unraid/ui';
</script>

<template>
  <Button 
    variant="ghost"
    class="text-xs font-semibold transition-colors duration-150 ease-in-out border-t-0 border-l-0 border-r-0 border-b-2 border-transparent hover:border-orange-dark focus:border-orange-dark focus:outline-hidden h-auto p-0"
  >
    <slot />
  </Button>
</template>
