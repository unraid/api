<script lang="ts" setup>
const nuxtApp = useNuxtApp();
onBeforeMount(() => {
  // @ts-expect-error
  nuxtApp.$customElements.registerEntry('UnraidComponents');
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
