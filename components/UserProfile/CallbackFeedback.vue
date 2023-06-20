<script lang="ts" setup>
import { useClipboard } from '@vueuse/core'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/solid';
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

const heading = computed(() => callbackLoading.value ? 'Performing actions' : 'Finished performing actions');
const subheading = computed(() => callbackLoading.value ? 'Please keep this window open' : '');

const close = () => {
  if (callbackLoading.value) return console.debug('[close] not allowed');
  callbackActionsStore.closeCallbackFeedback();
};
// @close="close"
// :show-close-x="!callbackLoading"

const reload = () => window.location.reload();

const { text, copy, copied, isSupported } = useClipboard({ source: keyUrl.value });
</script>

<template>
  <Modal
    :open="open"
    max-width="max-w-800px"
  >
    <div class="text-16px text-center relative w-full flex flex-col gap-y-16px py-16px">
      <header>
        <h1 class="text-24px font-semibold">{{ heading }}</h1>
        <p v-if="subheading" class="text-16px opacity-80">{{ subheading }}</p>
      </header>

      <BrandLoading v-if="callbackLoading" class="w-90px mx-auto" />

      <template v-if="installing !== undefined">
        <p v-if="installing || callbackLoading">Installing License Key…</p>
        <template v-else>
          <div v-if="success === true" class="flex items-center justify-center gap-x-8px">
            <CheckCircleIcon class="fill-green w-24px" />
            <p>Installed License Key</p>
          </div>
          <template v-else-if="success === false">
            <div class="flex items-center justify-center gap-x-8px">
              <XCircleIcon class="fill-red w-24px" />
              <p class="text-red italic">License Key Install Failed</p>
            </div>
            <button v-if="isSupported" @click="copy(keyUrl)">{{ copied ? 'Copied' : 'Copy Key URL' }}</button>
            <p v-else>Copy your Key URL: {{ keyUrl }}</p>
            <p>Then go to <a href="/Tools/Registration">Tools > Registration</a> to manually install it</p>
          </template>
        </template>
      </template>

      <template v-if="updating !== undefined">
        <p v-if="updating || callbackLoading">Updating Connect account config…</p>
        <template v-else>
          <div v-if="updateSuccess === true" class="flex items-center justify-center gap-x-8px">
            <CheckCircleIcon class="fill-green w-24px" />
            <p>Connect config updated</p>
          </div>
          <div v-else-if="updateSuccess === false" class="flex items-center justify-center gap-x-8px">
            <XCircleIcon class="fill-red w-24px" />
            <p class="text-red italic">Connect config update failed</p>
          </div>
        </template>
      </template>

      <div v-if="!callbackLoading" class="w-full max-w-xs flex flex-col gap-y-16px mx-auto">
        <button
          @click="reload"
          class="tracking-wide inline-block mx-8px opacity-60 hover:opacity-100 focus:opacity-100 underline transition"
        >
          {{ 'Reload Page to Finalize' }}
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
