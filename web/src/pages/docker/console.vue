<script setup lang="ts">
import { ref } from 'vue';

import Console from '@/components/Docker/Console.vue';
import { definePageMeta } from '#imports';

definePageMeta({
  layout: 'unraid-next',
});
</script>

<template>
  <div class="flex h-full flex-col p-4">
    <h1 class="mb-4 text-2xl font-bold">Console Component Test</h1>
    <Console />
  </div>
</template>
