<script setup lang="ts">
import { ref } from 'vue';
import { definePageMeta } from '#imports';
import Edit from '../../components/Docker/Edit.vue';

definePageMeta({
  layout: 'unraid-next',
});
</script>

<template>
  <div class="h-full flex flex-col p-4">
    <h1 class="text-2xl font-bold mb-4">Test Edit Component</h1>
    <Edit />
  </div>
</template>
