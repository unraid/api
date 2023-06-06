<script setup lang="ts">
import { storeToRefs } from 'pinia';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import { useCallbackStore } from '~/store/callback';

const callbackStore = useCallbackStore();

const { decryptedData } = storeToRefs(callbackStore);

onBeforeMount(() => {
  callbackStore.watcher();
});
</script>

<template>
  <div class="text-white font-semibold p-4 bg-orange-400 rounded-lg">
    <h2>CallbackHandler.ce</h2>
    <pre>{{ JSON.stringify(decryptedData, null, 2) }}</pre>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
