<script setup lang="ts">
import { onBeforeMount } from 'vue';
import { useCallbackActionsStore } from '~/store/callbackActions';

const callbackStore = useCallbackActionsStore();

onBeforeMount(() => {
  callbackStore.watcher();
});
</script>

<template>
  <div>
    <slot />
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '~/assets/main.css';
</style>
