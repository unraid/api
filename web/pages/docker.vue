<script setup lang="ts">
import { UButton, UPageHeader } from '#components';
import { definePageMeta } from '#imports';

definePageMeta({
  layout: 'unraid-next',
});

const test = 'Unraid Next Page';
const description = 'This is a sample page using the Unraid Next layout.';
</script>

<template>
  <div>
    <UPageHeader :title="test" :description="description" />

    <p class="mb-4">This is a sample page using the Unraid Next layout.</p>
    <p class="mb-4">You can customize this page as needed.</p>

    <UButton color="primary" />
  </div>
</template>
