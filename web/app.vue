<script lang="ts" setup>
import { onBeforeMount } from 'vue';
import { useCustomElements } from '#imports';
import { NuxtLayout, NuxtPage } from '#components';

const { registerEntry } = useCustomElements();
onBeforeMount(() => {
  registerEntry('UnraidComponents');
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
