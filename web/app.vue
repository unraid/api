<script lang="ts" setup>
const nuxtApp = useNuxtApp();
onBeforeMount(() => {
  // @ts-ignore
  nuxtApp.$customElements.registerEntry('UnraidComponents');
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
