<script lang="ts" setup>
const nuxtApp = useNuxtApp();
onBeforeMount(() => {
  nuxtApp.$customElements.registerEntry('ConnectComponents');
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
