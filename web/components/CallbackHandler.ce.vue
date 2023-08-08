<script setup lang="ts">
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

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
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
