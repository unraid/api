<script lang="ts" setup>
import { useClipboard } from '@vueuse/core'
import { ClipboardIcon, InformationCircleIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';
import { useAccountStore } from '~/store/account';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useInstallKeyStore } from '~/store/installKey';
import { usePromoStore } from '~/store/promo';
import { useServerStore } from '~/store/server';

export interface Props {
  open?: boolean;
}

withDefaults(defineProps<Props>(), {
  open: false,
});

const accountStore = useAccountStore();
const callbackActionsStore = useCallbackActionsStore();
const installKeyStore = useInstallKeyStore();
const promoStore = usePromoStore();
const serverStore = useServerStore();

const {
  accountActionStatus,
  accountActionStatusCopy,
} = storeToRefs(accountStore);
const {
  callbackStatus,
} = storeToRefs(callbackActionsStore);
const {
  keyActionType,
  keyUrl,
  keyInstallStatus,
  keyInstallStatusCopy,
  keyType,
} = storeToRefs(installKeyStore);
const {
  pluginInstalled,
} = storeToRefs(serverStore);

/** @todo if post purchase/upgrade thank user for their purchase and support */
/** @todo if post purchase/upgrade and no Connect, show CTA to Connect promo */
/** @todo if signing in show CTA to head to Connect settings to enable features */

const heading = computed(() => {
  switch (callbackStatus.value) {
    case 'error':
      return 'Error';
    case 'loading':
      return 'Performing actions';
    case 'success':
      return 'Success!';
  }
});
const subheading = computed(() => {
  switch (callbackStatus.value) {
    case 'loading':
      return 'Please keep this window open while we perform some actions';
    default:
      return '';
  }
});

const close = () => {
  if (callbackStatus.value === 'loading') return console.debug('[close] not allowed');
  window.location.reload();
  // callbackActionsStore.setCallbackStatus('ready');
};

const promoClick = () => {
  promoStore.openOnNextLoad();
  close();
};

const { text, copy, copied, isSupported } = useClipboard({ source: keyUrl.value });
</script>

<template>
  <Modal
    :title="heading"
    :description="subheading"
    :open="open"
    max-width="max-w-640px"
    :error="callbackStatus === 'error'"
    :success="callbackStatus === 'success'"
    @close="close"
    :show-close-x="callbackStatus !== 'loading'"
  >
    <template #main>
      <div class="text-16px text-center relative w-full min-h-[15vh] flex flex-col justify-center gap-y-16px">
        <div
          v-if="keyInstallStatus !== 'ready' || accountActionStatus !== 'ready'"
          class="flex flex-col gap-y-16px"
        >
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
              <p v-else>{{ 'Copy your Key URL' }}: {{ keyUrl }}</p>
              <p><a href="/Tools/Registration" class="opacity-75 hover:opacity-100 focus:opacity-100 underline transition">{{ 'Then go to Tools > Registration to manually install it' }}</a></p>
            </template>
          </UpcCallbackFeedbackStatus>

          <UpcCallbackFeedbackStatus
            v-if="accountActionStatus !== 'ready'"
            :success="accountActionStatus === 'success'"
            :error="accountActionStatus === 'failed'"
            :text="accountActionStatusCopy.text" />
        </div>
      </div>
    </template>

    <template #footer>
      <div v-if="callbackStatus === 'success'" class="flex flex-col gap-y-16px">
        <div v-if="!pluginInstalled" class="text-center flex flex-col justify-center gap-y-8px">
          <p>{{ 'Enhance your Unraid experience with Unraid Connect' }}</p>
          <span class="inline-flex justify-center">
            <BrandButton
              @click="promoClick"
              :icon="InformationCircleIcon"
              :text="'Learn More'"
            />
          </span>
        </div>

        <button
          @click="close"
          class="opacity-75 hover:opacity-100 focus:opacity-100 underline transition"
        >
          {{ !pluginInstalled ? 'No Thanks' : 'Close' }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
