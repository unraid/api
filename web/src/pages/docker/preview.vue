<script setup lang="ts">
import { ref } from 'vue';

import Preview from '@/components/Docker/Preview.vue';
import { definePageMeta } from '#imports';

definePageMeta({
  layout: 'unraid-next',
});
</script>

<template>
  <div class="flex h-full flex-col p-4">
    <h1 class="mb-4 text-2xl font-bold">Test Preview Component</h1>
    <Preview port="8080" />
  </div>
</template>
