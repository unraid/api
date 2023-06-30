<script lang="ts" setup>
import { useClipboard } from '@vueuse/core'
import { ClipboardIcon } from '@heroicons/vue/24/solid';
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

const { accountActionStatus, accountActionStatusCopy } = storeToRefs(accountStore);
const { callbackData, callbackStatus } = storeToRefs(callbackActionsStore);
const { keyUrl, keyInstallStatus, keyInstallStatusCopy, keyType } = storeToRefs(installKeyStore);

const heading = computed(() => callbackStatus.value === 'loading' ? 'Performing actions' : 'Finished performing actions');
const subheading = computed(() => callbackStatus.value === 'loading' ? 'Please keep this window open' : '');

const modalError = computed(() => callbackStatus.value === 'done' && (keyInstallStatus.value === 'failed' || accountActionStatus.value === 'failed'));
const modalSuccess = computed(() => {
  if (!callbackData.value) return false;
  // if we have multiple actions, we need both to be successful
  return callbackData.value.actions.length > 1
    ? callbackStatus.value === 'done' && (keyInstallStatus.value === 'success' && accountActionStatus.value === 'success')
    : callbackStatus.value === 'done' && (keyInstallStatus.value === 'success' || accountActionStatus.value === 'success');
});

// @todo keep for now as we may us`e this rather than refreshing once GQL is hooked up
// const close = () => {
//   if (callbackStatus.value === 'loading') return console.debug('[close] not allowed');
//   callbackActionsStore.setCallbackStatus('ready');
// };
// @close="close"
// :show-close-x="!callbackStatus === 'loading'"

const reload = () => window.location.reload();

const { text, copy, copied, isSupported } = useClipboard({ source: keyUrl.value });

watch(callbackStatus, (n, o) => console.debug('[callbackStatus]', n, o));
watch(accountActionStatus, (n, o) => console.debug('[accountActionStatus]', n, o));
watch(keyInstallStatus, (n, o) => console.debug('[keyInstallStatus]', n, o));
watch(modalError, (n, o) => console.debug('[modalError]', n, o));
watch(modalSuccess, (n, o) => console.debug('[modalSuccess]', n, o));
</script>

<template>
  <Modal
    :open="open"
    max-width="max-w-640px"
    :error="modalError"
    :success="modalSuccess"
  >
    <div class="text-16px text-center relative w-full min-h-[20vh] flex flex-col justify-between gap-y-16px">
      <header>
        <h1 class="text-24px font-semibold">{{ heading }}</h1>
        <p v-if="subheading" class="text-16px opacity-75">{{ subheading }}</p>
      </header>

      <!-- <BrandLoading v-if="callbackStatus === 'loading'" class="w-90px mx-auto" /> -->

      <UpcCallbackFeedbackStatus
        v-if="keyInstallStatus !== 'ready'"
        :success="keyInstallStatus === 'success'"
        :error="keyInstallStatus === 'failed'"
        :text="keyInstallStatusCopy.text"
      >
        <UpcUptimeExpire v-if="keyType === 'Trial'" :for-expire="true" class="opacity-75 italic mt-4px" />

        <template v-if="keyInstallStatus === 'failed'">
          <div v-if="isSupported" class="flex justify-center">
            <BrandButton
              @click="copy(keyUrl)"
              :icon="ClipboardIcon"
              :text="copied ? 'Copied' : 'Copy Key URL'" />
          </div>
          <p v-else>Copy your Key URL: {{ keyUrl }}</p>
          <p><a href="/Tools/Registration" class="opacity-75 hover:opacity-100 focus:opacity-100 underline transition">Then go to Tools > Registration to manually install it</a></p>
        </template>
      </UpcCallbackFeedbackStatus>

      <UpcCallbackFeedbackStatus
        v-if="accountActionStatus !== 'ready'"
        :success="accountActionStatus === 'success'"
        :error="accountActionStatus === 'failed'"
        :text="accountActionStatusCopy.text" />

      <footer>
        <div v-if="modalSuccess" class="w-full max-w-xs flex flex-col gap-y-16px mx-auto">
          <button
            @click="reload"
            class="opacity-75 hover:opacity-100 focus:opacity-100 underline transition"
          >
            {{ 'Reload Page to Finalize' }}
          </button>
        </div>
      </footer> 
    </div>
  </Modal>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
