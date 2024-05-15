<script lang="ts" setup>
const nuxtApp = useNuxtApp();
onBeforeMount(() => {
  // @ts-expect-error - becuase customElements is not a type in nuxtApp and is not provided by the nuxt plugin
  nuxtApp.$customElements.registerEntry('UnraidComponents');
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
