<script lang="ts" setup>
const nuxtApp = useNuxtApp();
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
