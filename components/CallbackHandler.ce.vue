<script setup lang="ts">
import { useCallbackStore } from '~/store/callback';
import '~/assets/main.css';
import { storeToRefs } from 'pinia';

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
