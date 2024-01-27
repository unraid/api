<script setup lang="ts">
import { useServerStore } from '~/store/server';
const serverStore = useServerStore();
const { updateOsIgnoredReleases } = storeToRefs(serverStore);
</script>

<template>
  <UpdateOsIgnoredRelease
    v-for="ignoredRelease in updateOsIgnoredReleases"
    :key="ignoredRelease"
    :label="ignoredRelease"
  />
</template>
