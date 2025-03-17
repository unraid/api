<script setup lang="ts">
import { useCallbackStore } from '~/store/callbackActions';

const callbackStore = useCallbackStore();

onBeforeMount(() => {
  callbackStore.watcher();
});
</script>

<template>
  <slot />
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '~/assets/main.css';
</style>
