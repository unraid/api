<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import { useCallbackStore } from '~/store/callback';

const callbackStore = useCallbackStore();
const { callbackFeedbackVisible, decryptedData } = storeToRefs(callbackStore);
onBeforeMount(() => {
  callbackStore.watcher();
});
</script>

<template>
  <Modal
    :open="callbackFeedbackVisible"
    @close="callbackStore.hide()"
    max-width="max-w-800px"
  >
    <div class="text-center relative w-full flex flex-col gap-y-16px">
      <header>
        <h1 class="text-24px font-semibold flex flex-wrap justify-center gap-x-1">Callback Feedback</h1>
      </header>

      <BrandLoading class="w-90px mx-auto" />
      <pre class="text-left text-black p-8px w-full overflow-scroll bg-gray-400">{{ JSON.stringify(decryptedData, null, 2) }}</pre>

      <div class="w-full max-w-xs flex flex-col gap-y-16px mx-auto">
        <button
          @click="callbackStore.hide()"
          class="text-12px tracking-wide inline-block mx-8px opacity-60 hover:opacity-100 focus:opacity-100 underline transition"
          :title="'Close Promo'"
        >
          {{ 'Close' }}
        </button>
      </div>
    </div>
  </Modal>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
