<script setup lang="ts">
import { useCallbackActionsStore } from '~/store/callbackActions';

const callbackStore = useCallbackActionsStore();

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
