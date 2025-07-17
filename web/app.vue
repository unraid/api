<script lang="ts" setup>
import { onMounted } from 'vue';
import { NuxtLayout, NuxtPage } from '#components';
import { devConfig } from '~/helpers/env';

onMounted(() => {
  document.documentElement.setAttribute('data-env', devConfig.NODE_ENV || 'production');
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
