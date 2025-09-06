<script setup lang="ts">
import { ref } from 'vue';

import Edit from '@/components/Docker/Edit.vue';
import { definePageMeta } from '#imports';

definePageMeta({
  layout: 'unraid-next',
});
</script>

<template>
  <div class="flex h-full flex-col p-4">
    <h1 class="mb-4 text-2xl font-bold">Test Edit Component</h1>
    <Edit />
  </div>
</template>
