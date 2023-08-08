<script lang="ts" setup>
const nuxtApp = useNuxtApp();
onBeforeMount(() => {
  nuxtApp.$customElements.registerEntry('UnraidComponents');
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
