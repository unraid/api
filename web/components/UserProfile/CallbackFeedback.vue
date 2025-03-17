<script lang="ts" setup>
// @todo ensure key installs and updateOs can be handled at the same time
// @todo with multiple actions of key install and update after successful key install, rather than showing default success message, show a message to have them confirm the update
import { storeToRefs } from 'pinia';
import { useClipboard } from '@vueuse/core';

import {
  CheckIcon,
  ChevronDoubleDownIcon,
  ClipboardIcon,
  CogIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/vue/24/solid';
import { BrandButton, BrandLoading } from '@unraid/ui';
import { WEBGUI_CONNECT_SETTINGS, WEBGUI_TOOLS_REGISTRATION } from '~/helpers/urls';

import type { ComposerTranslation } from 'vue-i18n';

import { useAccountStore } from '~/store/account';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useInstallKeyStore } from '~/store/installKey';
// import { usePromoStore } from '~/store/promo';
import { useServerStore } from '~/store/server';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

export interface Props {
  open?: boolean;
  t: ComposerTranslation;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const accountStore = useAccountStore();
const callbackActionsStore = useCallbackActionsStore();
const installKeyStore = useInstallKeyStore();
// const promoStore = usePromoStore();
const serverStore = useServerStore();
const updateOsActionStore = useUpdateOsActionsStore();

const { accountAction, accountActionHide, accountActionStatus, accountActionType } =
  storeToRefs(accountStore);
const { callbackStatus } = storeToRefs(callbackActionsStore);
const { keyActionType, keyUrl, keyInstallStatus, keyType } = storeToRefs(installKeyStore);
const {
  connectPluginInstalled,
  refreshServerStateStatus,
  username,
  osVersion,
  stateData,
  stateDataError,
} = storeToRefs(serverStore);
const {
  status: updateOsStatus,
  callbackTypeDowngrade,
  callbackUpdateRelease,
} = storeToRefs(updateOsActionStore);
/**
 * Post sign in success state:
 * If we're on the Connect settings page in the webGUI
 * the modal should close instead of redirecting to the
 * settings page.
 *
 * @todo figure out the difference between document.location and window.location in relation to the webGUI and webGUI being iframed
 */
const isSettingsPage = ref<boolean>(document.location.pathname === '/Settings/ManagementAccess');

// const showPromoCta = computed(() => callbackStatus.value === 'success' && !connectPluginInstalled.value);

const heading = computed(() => {
  if (updateOsStatus.value === 'confirming') {
    return callbackTypeDowngrade.value
      ? props.t('Downgrade Unraid OS confirmation required')
      : props.t('Update Unraid OS confirmation required');
  }
  switch (callbackStatus.value) {
    case 'error':
      return props.t('Error');
    case 'loading':
      return props.t('Performing actions');
    case 'success':
      return props.t('Success!');
  }
  return '';
});
const subheading = computed(() => {
  if (updateOsStatus.value === 'confirming') {
    return callbackTypeDowngrade.value
      ? props.t('Please confirm the downgrade details below')
      : props.t('Please confirm the update details below');
  }
  if (callbackStatus.value === 'error') {
    return props.t('Something went wrong'); /** @todo show actual error messages */
  }
  if (callbackStatus.value === 'loading') {
    return props.t('Please keep this window open while we perform some actions');
  }
  if (callbackStatus.value === 'success') {
    if (accountActionType.value === 'signIn') {
      return props.t("You're one step closer to enhancing your Unraid experience");
    }
    if (keyActionType.value === 'purchase') {
      return props.t('Thank you for purchasing an Unraid {0} Key!', [keyType.value]);
    }
    if (keyActionType.value === 'replace') {
      return props.t('Your {0} Key has been replaced!', [keyType.value]);
    }
    if (keyActionType.value === 'trialExtend') {
      return props.t('Your Trial key has been extended!');
    }
    if (keyActionType.value === 'trialStart') {
      return props.t(
        'Your free Trial key provides all the functionality of an Unleashed Registration key'
      );
    }
    if (keyActionType.value === 'upgrade') {
      return props.t('Thank you for upgrading to an Unraid {0} Key!', [keyType.value]);
    }
    return '';
  }
  return '';
});

const closeText = computed(() => props.t('Close')); // !connectPluginInstalled.value ? props.t('No thanks') :
const close = () => {
  if (callbackStatus.value === 'loading') {
    return;
  }
  return refreshServerStateStatus.value === 'done'
    ? callbackActionsStore.setCallbackStatus('ready')
    : window.location.reload();
};

const confirmUpdateOs = () => {
  updateOsActionStore.installOsUpdate();
  callbackActionsStore.setCallbackStatus('ready');
};

const cancelUpdateOs = () => {
  updateOsActionStore.setStatus('ready');
  callbackActionsStore.setCallbackStatus('ready');
};

// const promoClick = () => {
//   promoStore.openOnNextLoad();
//   close();
// };

const keyInstallStatusCopy = computed((): { text: string } => {
  let txt1 = props.t('Installing');
  let txt2 = props.t('Installed');
  let txt3 = props.t('Install');
  switch (keyInstallStatus.value) {
    case 'installing':
      if (keyActionType.value === 'trialExtend') {
        txt1 = props.t('Installing Extended Trial');
      }
      if (keyActionType.value === 'recover') {
        txt1 = props.t('Installing Recovered');
      }
      if (keyActionType.value === 'renew') {
        txt1 = props.t('Installing Extended');
      }
      if (keyActionType.value === 'replace') {
        txt1 = props.t('Installing Replaced');
      }
      return {
        text: props.t('{0} {1} Key…', [txt1, keyType.value]),
      };
    case 'success':
      if (keyActionType.value === 'renew' || keyActionType.value === 'trialExtend') {
        txt2 = props.t('Extension Installed');
      }
      if (keyActionType.value === 'recover') {
        txt2 = props.t('Recovered');
      }
      if (keyActionType.value === 'replace') {
        txt2 = props.t('Replaced');
      }
      return {
        text: props.t('{1} Key {0} Successfully', [txt2, keyType.value]),
      };
    case 'failed':
      if (keyActionType.value === 'trialExtend') {
        txt3 = props.t('Install Extended');
      }
      if (keyActionType.value === 'recover') {
        txt3 = props.t('Install Recovered');
      }
      if (keyActionType.value === 'replace') {
        txt3 = props.t('Install Replaced');
      }
      return {
        text: props.t('Failed to {0} {1} Key', [txt3, keyType.value]),
      };
    case 'ready':
    default:
      return {
        text: props.t('Ready to Install Key'),
      };
  }
});

const accountActionStatusCopy = computed((): { text: string } => {
  switch (accountActionStatus.value) {
    case 'waiting':
      return {
        text: accountAction.value?.type === 'signIn' ? props.t('Signing In') : props.t('Signing Out'),
      };
    case 'updating':
      return {
        text:
          accountAction.value?.type === 'signIn'
            ? props.t('Signing in {0}…', [accountAction.value.user?.preferred_username])
            : props.t('Signing out {0}…', [username.value]),
      };
    case 'success':
      return {
        text:
          accountAction.value?.type === 'signIn'
            ? props.t('{0} Signed In Successfully', [accountAction.value.user?.preferred_username])
            : props.t('{0} Signed Out Successfully', [username.value]),
      };
    case 'failed':
      return {
        text:
          accountAction.value?.type === 'signIn'
            ? props.t('Sign In Failed')
            : props.t('Sign Out Failed'),
      };
    case 'ready':
    default:
      return {
        text: props.t('Ready to update Connect account configuration'),
      };
  }
});

const { copy, copied, isSupported } = useClipboard({ source: keyUrl.value });

/**
 * Ideally we'd show this based off of regExp.value, but we will not have that value yet.
 * So we'll use the keyType.value that we get from the keyInstall store.
 */
const showUpdateEligibility = computed(() => {
  // rather than specifically targeting 'Starter' and 'Unleashed' we'll target all keys that are not 'Basic', 'Plus', 'Pro', 'Lifetime', or 'Trial'
  if (!keyType.value) {
    return false;
  }
  return !['Basic', 'Plus', 'Pro', 'Lifetime', 'Trial'].includes(keyType.value);
});
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
        class="text-center relative w-full flex flex-col justify-center gap-y-16px py-24px"
      >
        <BrandLoading v-if="callbackStatus === 'loading'" class="w-[110px] mx-auto" />

        <UpcCallbackFeedbackStatus
          v-if="keyInstallStatus !== 'ready'"
          :success="keyInstallStatus === 'success'"
          :error="keyInstallStatus === 'failed'"
          :text="keyInstallStatusCopy.text"
        >
          <div v-if="keyType === 'Trial'" class="opacity-75 italic mt-4px">
            <UpcUptimeExpire v-if="refreshServerStateStatus === 'done'" :for-expire="true" :t="t" />
            <p v-else>
              {{ t('Calculating trial expiration…') }}
            </p>
          </div>
          <div v-if="showUpdateEligibility" class="opacity-75 italic mt-4px">
            <RegistrationUpdateExpiration v-if="refreshServerStateStatus === 'done'" :t="t" />
            <p v-else>
              {{ t('Calculating OS Update Eligibility…') }}
            </p>
          </div>

          <template v-if="keyInstallStatus === 'failed'">
            <div v-if="isSupported" class="flex justify-center">
              <BrandButton
                :icon="ClipboardIcon"
                :text="copied ? t('Copied') : t('Copy Key URL')"
                @click="copy(keyUrl)"
              />
            </div>
            <p v-else>
              {{ t('Copy your Key URL: {0}', [keyUrl]) }}
            </p>
            <p>
              <a
                href="/Tools/Registration"
                class="opacity-75 hover:opacity-100 focus:opacity-100 underline transition"
              >
                {{ t('Then go to Tools > Registration to manually install it') }}
              </a>
            </p>
          </template>
        </UpcCallbackFeedbackStatus>

        <UpcCallbackFeedbackStatus
          v-if="
            stateDataError &&
            callbackStatus !== 'loading' &&
            (keyInstallStatus === 'success' || keyInstallStatus === 'failed')
          "
          :error="true"
          :text="t('Post Install License Key Error')"
        >
          <h4 class="text-18px text-left font-semibold">
            {{ t(stateData.heading) }}
          </h4>
          <div class="text-left text-16px" v-html="t(stateData.message)" />
        </UpcCallbackFeedbackStatus>

        <UpcCallbackFeedbackStatus
          v-if="accountActionStatus !== 'ready' && !accountActionHide"
          :success="accountActionStatus === 'success'"
          :error="accountActionStatus === 'failed'"
          :text="accountActionStatusCopy.text"
        />

        <!-- <UpcCallbackFeedbackStatus
          v-if="showPromoCta"
          :icon="InformationCircleIcon"
          :text="t('Enhance your experience with Unraid Connect')"
        /> -->
      </div>

      <template v-if="updateOsStatus === 'confirming' && !stateDataError">
        <div class="text-center flex flex-col gap-y-8px my-16px">
          <div class="flex flex-col gap-y-4px">
            <p class="text-18px">
              {{ t('Current Version: Unraid {0}', [osVersion]) }}
            </p>

            <ChevronDoubleDownIcon class="animate-pulse w-32px h-32px mx-auto fill-current opacity-50" />

            <p class="text-18px">
              {{ t('New Version: {0}', [callbackUpdateRelease?.name]) }}
            </p>

            <p class="text-14px italic opacity-75">
              {{
                callbackTypeDowngrade
                  ? t('This downgrade will require a reboot')
                  : t('This update will require a reboot')
              }}
            </p>
          </div>
        </div>
      </template>
    </template>

    <template v-if="callbackStatus === 'success' || updateOsStatus === 'confirming'" #footer>
      <div class="flex flex-row justify-center gap-16px">
        <template v-if="callbackStatus === 'success'">
          <BrandButton variant="underline" :icon="XMarkIcon" :text="closeText" @click="close" />

          <template v-if="connectPluginInstalled && accountActionType === 'signIn'">
            <BrandButton
              v-if="isSettingsPage"
              class="grow-0"
              :icon="CogIcon"
              :text="t('Configure Connect Features')"
              @click="close"
            />
            <BrandButton
              v-else
              class="grow-0"
              :href="WEBGUI_CONNECT_SETTINGS.toString()"
              :icon="CogIcon"
              :text="t('Configure Connect Features')"
            />
          </template>

          <!-- <BrandButton
            v-if="showPromoCta"
            :text="t('Learn More')"
            @click="promoClick"
          /> -->
        </template>

        <template v-if="updateOsStatus === 'confirming' && !stateDataError">
          <BrandButton
            variant="underline"
            :icon="XMarkIcon"
            :text="t('Cancel')"
            @click="cancelUpdateOs"
          />
          <BrandButton
            :icon="CheckIcon"
            :text="
              callbackTypeDowngrade ? t('Confirm and start downgrade') : t('Confirm and start update')
            "
            @click="confirmUpdateOs"
          />
        </template>

        <template v-if="stateDataError">
          <BrandButton
            :href="WEBGUI_TOOLS_REGISTRATION.toString()"
            :icon="WrenchScrewdriverIcon"
            :text="t('Fix Error')"
          />
        </template>
      </div>
    </template>
  </Modal>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '~/assets/main.css';

.unraid_mark_2,
.unraid_mark_4 {
  animation: mark_2 1.5s ease infinite;
}
.unraid_mark_3 {
  animation: mark_3 1.5s ease infinite;
}
.unraid_mark_6,
.unraid_mark_8 {
  animation: mark_6 1.5s ease infinite;
}
.unraid_mark_7 {
  animation: mark_7 1.5s ease infinite;
}

@keyframes mark_2 {
  50% {
    transform: translateY(-40px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_3 {
  50% {
    transform: translateY(-62px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_6 {
  50% {
    transform: translateY(40px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_7 {
  50% {
    transform: translateY(62px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
