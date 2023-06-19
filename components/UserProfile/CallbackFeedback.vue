<script lang="ts" setup>
import { useClipboard } from '@vueuse/core'
import { storeToRefs } from 'pinia';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';
import { useAccountStore } from '~/store/account';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useInstallKeyStore } from '~/store/installKey';

export interface Props {
  open?: boolean;
}

withDefaults(defineProps<Props>(), {
  open: false,
});

const accountStore = useAccountStore();
const callbackActionsStore = useCallbackActionsStore();
const installKeyStore = useInstallKeyStore();

const { updating, updateSuccess } = storeToRefs(accountStore);
const { callbackLoading } = storeToRefs(callbackActionsStore);
const { keyUrl, installing, success } = storeToRefs(installKeyStore);

const heading = computed(() => {
  callbackLoading.value ? 'Performing actions' : 'Finished performing actions';
});

const subheading = computed(() => {
  callbackLoading.value ? 'Please keep this window open' : '';
});

const close = () => {
  if (callbackLoading.value) return console.debug('[close] not allowed');
  callbackActionsStore.closeCallbackFeedback();
};

const { text, copy, copied, isSupported } = useClipboard({ source: keyUrl.value });
</script>

<template>
  <Modal
    :open="open"
    @close="close"
    max-width="max-w-800px"
    :show-close-x="!callbackLoading"
  >
    <div class="text-center relative w-full flex flex-col gap-y-16px">
      <header>
        <h1 class="text-24px font-semibold">{{ heading }}</h1>
        <p v-if="subheading" class="text-16px opacity-80">{{ subheading }}</p>
      </header>

      <BrandLoading v-if="callbackLoading" class="w-90px mx-auto" />

      <template v-if="installing !== undefined">
        <p v-if="installing">Installing License Key</p>
        <template v-else>
          <p v-if="success === true">Installed License Key</p>
          <template v-else-if="success === false">
            <p class="text-red italic">License Key Install Failed</p>
            <button v-if="isSupported" @click="copy(keyUrl)">{{ copied ? 'Copied' : 'Copy Key URL' }}</button>
            <p v-else>Copy your Key URL: {{ keyUrl }}</p>
            <p>Then go to <a href="/Tools/Registration">Tools > Registration</a> to manually install it</p>
          </template>
        </template>
      </template>

      <template v-if="updating !== undefined">
        <p v-if="updating">Updating Connect account config</p>
        <template v-else>
          <p v-if="updateSuccess === true">Connect config updated with your account</p>
          <p v-else-if="updateSuccess === false" class="text-red italic">Connect config failed to update</p>
        </template>
      </template>

      <div v-if="!callbackLoading" class="w-full max-w-xs flex flex-col gap-y-16px mx-auto">
        <button
          @click="close"
          class="text-12px tracking-wide inline-block mx-8px opacity-60 hover:opacity-100 focus:opacity-100 underline transition"
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
