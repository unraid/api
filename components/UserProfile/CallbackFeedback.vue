<script lang="ts" setup>
import { useClipboard } from '@vueuse/core';
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
  t: any;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const accountStore = useAccountStore();
const callbackActionsStore = useCallbackActionsStore();
const installKeyStore = useInstallKeyStore();
const promoStore = usePromoStore();
const serverStore = useServerStore();

const {
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
  connectPluginInstalled,
  registered,
  authAction,
  refreshServerStateStatus,
} = storeToRefs(serverStore);

/**
 * Post sign in success state:
 * If we're on the Connect settings page in the webGUI
 * the modal should close instead of redirecting to the
 * settings page.
 *
 * @todo figure out the difference between document.location and window.location
 */
const isSettingsPage = ref<boolean>(document.location.pathname === '/Settings/ManagementAccess');

const showPromoCta = computed(() => callbackStatus.value === 'success' && !connectPluginInstalled.value);
const showSignInCta = computed(() => connectPluginInstalled.value && !registered.value && authAction.value?.name === 'signIn' && accountActionType.value !== 'signIn');

const heading = computed(() => {
  switch (callbackStatus.value) {
    case 'error':
      return props.t('Error');
    case 'loading':
      return props.t('Performing actions');
    case 'success':
      return props.t('Success!');
  }
});
const subheading = computed(() => {
  if (callbackStatus.value === 'error') {
    return props.t('Something went wrong'); /** @todo show actual error messages */
  }
  if (callbackStatus.value === 'loading') { return props.t('Please keep this window open while we perform some actions'); }
  if (callbackStatus.value === 'success') {
    if (accountActionType.value === 'signIn') { return props.t('You\'re one step closer to enhancing your Unraid experience'); }
    if (keyActionType.value === 'purchase') { return props.t('Thank you for purchasing an Unraid %{keyType} Key!', { keyType: keyType.value }); }
    if (keyActionType.value === 'replace') { return props.t('Your %{keyType} Key has been replaced!', { keyType: keyType.value }); }
    if (keyActionType.value === 'trialExtend') { return props.t('Your Trial key has been extended!'); }
    if (keyActionType.value === 'trialStart') { return props.t('Your free Trial key provides all the functionality of a Pro Registration key'); }
    if (keyActionType.value === 'upgrade') { return props.t('Thank you for upgrading to an Unraid %{keyType} Key!', { keyType: keyType.value }); }
    return '';
  }
  return '';
});

const closeText = computed(() => {
  const txt = !connectPluginInstalled.value ? props.t('No thanks') : props.t('Close');
  return refreshServerStateStatus.value === 'done' ? txt : props.t('Reload');
});
const close = () => {
  if (callbackStatus.value === 'loading') { return console.debug('[close] not allowed'); }
  return refreshServerStateStatus.value === 'done'
    ? callbackActionsStore.setCallbackStatus('ready')
    : window.location.reload();
};

const promoClick = () => {
  promoStore.openOnNextLoad();
  close();
};

const { copy, copied, isSupported } = useClipboard({ source: keyUrl.value });
</script>

<template>
  <Modal
    :t="t"
    :title="heading"
    :description="subheading"
    :open="open"
    max-width="max-w-640px"
    :error="callbackStatus === 'error'"
    :success="callbackStatus === 'success'"
    :show-close-x="callbackStatus !== 'loading'"
    @close="close"
  >
    <template #main>
      <div
        v-if="keyInstallStatus !== 'ready' || accountActionStatus !== 'ready'"
        class="text-center relative w-full flex flex-col justify-center gap-y-16px py-24px sm:py-32px"
      >
        <BrandLoading v-if="callbackStatus === 'loading'" class="w-[110px] mx-auto" />

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
                :icon="ClipboardIcon"
                :text="copied ? t('Copied') : t('Copy Key URL')"
                @click="copy(keyUrl)"
              />
            </div>
            <p v-else>
              {{ t('Copy your Key URL: %{keyUrl}', { keyUrl }) }}
            </p>
            <p><a href="/Tools/Registration" class="opacity-75 hover:opacity-100 focus:opacity-100 underline transition">{{ t('Then go to Tools > Registration to manually install it') }}</a></p>
          </template>
        </UpcCallbackFeedbackStatus>

        <UpcCallbackFeedbackStatus
          v-if="accountActionStatus !== 'ready' && !accountActionHide"
          :success="accountActionStatus === 'success'"
          :error="accountActionStatus === 'failed'"
          :text="accountActionStatusCopy.text"
        />

        <UpcCallbackFeedbackStatus
          v-if="showPromoCta"
          :icon="InformationCircleIcon"
          :text="t('Enhance your experience with Unraid Connect')"
        />

        <UpcCallbackFeedbackStatus
          v-if="showSignInCta"
          :icon="InformationCircleIcon"
          :text="t('Sign In to utilize Unraid Connect')"
        />
      </div>
    </template>

    <template #footer>
      <div v-if="callbackStatus === 'success'" class="flex flex-row-reverse justify-center gap-16px">
        <template v-if="connectPluginInstalled && accountActionType === 'signIn'">
          <BrandButton
            v-if="isSettingsPage"
            :icon="CogIcon"
            :text="t('Configure Connect Features')"
            class="grow-0"
            @click="close"
          />
          <BrandButton
            v-else
            :href="PLUGIN_SETTINGS"
            :icon="CogIcon"
            :text="t('Configure Connect Features')"
            class="grow-0"
          />
        </template>

        <BrandButton
          v-if="showPromoCta"
          :text="t('Learn More')"
          @click="promoClick"
        />

        <BrandButton
          v-if="showSignInCta"
          :external="authAction?.external"
          :icon="authAction?.icon"
          :text="t(authAction?.text)"
          @click="authAction?.click"
        />

        <BrandButton
          btn-style="underline"
          :text="closeText"
          @click="close"
        />
      </div>
    </template>
  </Modal>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
