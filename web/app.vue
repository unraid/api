<script lang="ts" setup>
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
