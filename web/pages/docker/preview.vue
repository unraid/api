<script setup lang="ts">
import { ref } from 'vue';
import { definePageMeta } from '#imports';
import Preview from '../../components/Docker/Preview.vue';

definePageMeta({
  layout: 'unraid-next',
});
</script>

<template>
  <div class="h-full flex flex-col p-4">
    <h1 class="text-2xl font-bold mb-4">Test Preview Component</h1>
    <Preview port="8080" />
  </div>
</template>
