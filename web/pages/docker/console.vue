<script setup lang="ts">
import { ref } from 'vue';
import { definePageMeta } from '#imports';
import Console from '../../components/Docker/Console.vue';

definePageMeta({
  layout: 'unraid-next',
});
</script>

<template>
  <div class="h-full flex flex-col p-4">
    <h1 class="text-2xl font-bold mb-4">Console Component Test</h1>
    <Console />
  </div>
</template>
