<script lang="ts" setup>
import { useClipboard } from '@vueuse/core'
import { ClipboardIcon, CogIcon, InformationCircleIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';
import { PLUGIN_SETTINGS } from '~/helpers/urls';
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
  accountAction,
  accountActionHide,
  accountActionStatus,
  accountActionStatusCopy,
  accountActionType,
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
  registered,
  authAction,
} = storeToRefs(serverStore);

/** @todo if post purchase/upgrade thank user for their purchase and support */
/** @todo if post purchase/upgrade and no Connect, show CTA to Connect promo */
/** @todo if signing in show CTA to head to Connect settings to enable features */

/**
 * Post sign in success state:
 * If we're on the Connect settings page in the webGUI
 * the modal should close instead of redirecting to the
 * settings page.
 * 
 * @todo figure out the difference between document.location and window.location
 */
const isSettingsPage = ref<boolean>(document.location.pathname === '/Settings/ManagementAccess');

const showPromoCta = computed(() => callbackStatus.value === 'success' && !pluginInstalled.value);
const showSignInCta = computed(() => pluginInstalled.value && !registered.value && authAction.value?.name === 'signIn' && accountActionType.value !== 'signIn');

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
  if (callbackStatus.value === 'error') {
    return 'Something went wrong'; /** @todo show actual error messages */
  }
  if (callbackStatus.value === 'loading') return 'Please keep this window open while we perform some actions';
  if (callbackStatus.value === 'success') {
    if (accountActionType.value === 'signIn') return `You're one step closer to enhancing your Unraid experience`;
    if (keyActionType.value === 'purchase') return `Thank you for purchasing an Unraid ${keyType.value} Key!`;
    if (keyActionType.value === 'replace') return `Your ${keyType.value} Key has been replaced!`;
    if (keyActionType.value === 'trialExtend') return `Your Trial key has been extended!`;
    if (keyActionType.value === 'trialStart') return `Your free Trial key provides all the functionality of a Pro Registration key`;
    if (keyActionType.value === 'upgrade') return `Thank you for upgrading to an Unraid ${keyType.value} Key!`;
    return '';
  }
  return '';
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
      <div
        v-if="keyInstallStatus !== 'ready' || accountActionStatus !== 'ready'"
        class="text-center relative w-full flex flex-col justify-center gap-y-16px py-24px sm:py-32px"
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
          v-if="accountActionStatus !== 'ready' && !accountActionHide"
          :success="accountActionStatus === 'success'"
          :error="accountActionStatus === 'failed'"
          :text="accountActionStatusCopy.text" />

        <UpcCallbackFeedbackStatus
          v-if="showPromoCta"
          :icon="InformationCircleIcon"
          :text="'Enhance your experience with Unraid Connect'" />

        <UpcCallbackFeedbackStatus
          v-if="showSignInCta"
          :icon="InformationCircleIcon"
          :text="'Sign In to utilize Unraid Connect'" />
      </div>
    </template>

    <template #footer>
      <div v-if="callbackStatus === 'success'" class="flex flex-row-reverse justify-center gap-16px">
        <template v-if="pluginInstalled && accountActionType === 'signIn'">
          <BrandButton
            v-if="isSettingsPage"
            @click="close"
            :icon="CogIcon"
            :text="'Configure Connect Features'"
            class="grow-0" />
          <BrandButton
            v-else
            :href="PLUGIN_SETTINGS"
            :icon="CogIcon"
            :text="'Configure Connect Features'"
            class="grow-0" />
        </template>

        <BrandButton
          v-if="showPromoCta"
          @click="promoClick"
          :text="'Learn More'" />

        <BrandButton
          v-if="showSignInCta"
          @click="authAction?.click"
          :external="authAction?.external"
          :icon="authAction?.icon"
          :text="authAction?.text" />

        <BrandButton
          @click="close"
          btn-style="underline"
          :text="!pluginInstalled ? 'No Thanks' : 'Close'" />
      </div>
    </template>
  </Modal>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
