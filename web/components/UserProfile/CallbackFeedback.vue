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

import { useI18n } from '~/composables/useI18n';
import { useAccountStore } from '~/store/account';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useInstallKeyStore } from '~/store/installKey';
import { useServerStore } from '~/store/server';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

export interface Props {
  open?: boolean;
}

defineProps<Props>();

const { $gettext } = useI18n();
const accountStore = useAccountStore();
const callbackActionsStore = useCallbackActionsStore();
const installKeyStore = useInstallKeyStore();
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

const heading = computed(() => {
  if (updateOsStatus.value === 'confirming') {
    return callbackTypeDowngrade.value
      ? $gettext('Downgrade Unraid OS confirmation required')
      : $gettext('Update Unraid OS confirmation required');
  }
  switch (callbackStatus.value) {
    case 'error':
      return $gettext('Error');
    case 'loading':
      return $gettext('Performing actions');
    case 'success':
      return $gettext('Success!');
  }
  return '';
});
const subheading = computed(() => {
  if (updateOsStatus.value === 'confirming') {
    return callbackTypeDowngrade.value
      ? $gettext('Please confirm the downgrade details below')
      : $gettext('Please confirm the update details below');
  }
  if (callbackStatus.value === 'error') {
    return $gettext('Something went wrong'); /** @todo show actual error messages */
  }
  if (callbackStatus.value === 'loading') {
    return $gettext('Please keep this window open while we perform some actions');
  }
  if (callbackStatus.value === 'success') {
    if (accountActionType.value === 'signIn') {
      return $gettext("You're one step closer to enhancing your Unraid experience");
    }
    if (keyActionType.value === 'purchase') {
      return $gettext(`Thank you for purchasing an Unraid ${keyType.value} Key!`);
    }
    if (keyActionType.value === 'replace') {
      return $gettext(`Your ${keyType.value} Key has been replaced!`);
    }
    if (keyActionType.value === 'trialExtend') {
      return $gettext('Your Trial key has been extended!');
    }
    if (keyActionType.value === 'trialStart') {
      return $gettext(
        'Your free Trial key provides all the functionality of an Unleashed Registration key'
      );
    }
    if (keyActionType.value === 'upgrade') {
      return $gettext(`Thank you for upgrading to an Unraid ${keyType.value} Key!`);
    }
    return '';
  }
  return '';
});

const closeText = computed(() => $gettext('Close')); // !connectPluginInstalled.value ? $gettext('No thanks') :
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

const keyInstallStatusCopy = computed((): { text: string } => {
  let txt1 = $gettext('Installing');
  let txt2 = $gettext('Installed');
  let txt3 = $gettext('Install');
  switch (keyInstallStatus.value) {
    case 'installing':
      if (keyActionType.value === 'trialExtend') {
        txt1 = $gettext('Installing Extended Trial');
      }
      if (keyActionType.value === 'recover') {
        txt1 = $gettext('Installing Recovered');
      }
      if (keyActionType.value === 'renew') {
        txt1 = $gettext('Installing Extended');
      }
      if (keyActionType.value === 'replace') {
        txt1 = $gettext('Installing Replaced');
      }
      return {
        text: $gettext(`${txt1} ${keyType.value} Key…`),
      };
    case 'success':
      if (keyActionType.value === 'renew' || keyActionType.value === 'trialExtend') {
        txt2 = $gettext('Extension Installed');
      }
      if (keyActionType.value === 'recover') {
        txt2 = $gettext('Recovered');
      }
      if (keyActionType.value === 'replace') {
        txt2 = $gettext('Replaced');
      }
      return {
        text: $gettext(`${keyType.value} Key ${txt2} Successfully`),
      };
    case 'failed':
      if (keyActionType.value === 'trialExtend') {
        txt3 = $gettext('Install Extended');
      }
      if (keyActionType.value === 'recover') {
        txt3 = $gettext('Install Recovered');
      }
      if (keyActionType.value === 'replace') {
        txt3 = $gettext('Install Replaced');
      }
      return {
        text: $gettext(`Failed to ${txt3} ${keyType.value} Key`),
      };
    case 'ready':
    default:
      return {
        text: $gettext('Ready to Install Key'),
      };
  }
});

const accountActionStatusCopy = computed((): { text: string } => {
  switch (accountActionStatus.value) {
    case 'waiting':
      return {
        text: accountAction.value?.type === 'signIn' ? $gettext('Signing In') : $gettext('Signing Out'),
      };
    case 'updating':
      return {
        text:
          accountAction.value?.type === 'signIn'
            ? $gettext(`Signing in ${accountAction.value.user?.preferred_username}…`)
            : $gettext(`Signing out ${username.value}…`),
      };
    case 'success':
      return {
        text:
          accountAction.value?.type === 'signIn'
            ? $gettext(`${accountAction.value.user?.preferred_username} Signed In Successfully`)
            : $gettext(`${username.value} Signed Out Successfully`),
      };
    case 'failed':
      return {
        text:
          accountAction.value?.type === 'signIn'
            ? $gettext('Sign In Failed')
            : $gettext('Sign Out Failed'),
      };
    case 'ready':
    default:
      return {
        text: $gettext('Ready to update Connect account configuration'),
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
            <UpcUptimeExpire v-if="refreshServerStateStatus === 'done'" :for-expire="true" :t="$gettext" />
            <p v-else>
              {{ $gettext('Calculating trial expiration…') }}
            </p>
          </div>
          <div v-if="showUpdateEligibility" class="opacity-75 italic mt-4px">
            <RegistrationUpdateExpiration v-if="refreshServerStateStatus === 'done'" :t="$gettext" />
            <p v-else>
              {{ $gettext('Calculating OS Update Eligibility…') }}
            </p>
          </div>

          <template v-if="keyInstallStatus === 'failed'">
            <div v-if="isSupported" class="flex justify-center">
              <BrandButton
                :icon="ClipboardIcon"
                :text="copied ? $gettext('Copied') : $gettext('Copy Key URL')"
                @click="copy(keyUrl)"
              />
            </div>
            <p v-else>
              {{ $gettext(`Copy your Key URL: ${keyUrl}`) }}
            </p>
            <p>
              <a
                href="/Tools/Registration"
                class="opacity-75 hover:opacity-100 focus:opacity-100 underline transition"
              >
                {{ $gettext('Then go to Tools > Registration to manually install it') }}
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
          :text="$gettext('Post Install License Key Error')"
        >
          <h4 class="text-18px text-left font-semibold">
            {{ $gettext(stateData.heading) }}
          </h4>
          <div class="text-left text-16px" v-html="$gettext(stateData.message)" />
        </UpcCallbackFeedbackStatus>

        <UpcCallbackFeedbackStatus
          v-if="accountActionStatus !== 'ready' && !accountActionHide"
          :success="accountActionStatus === 'success'"
          :error="accountActionStatus === 'failed'"
          :text="accountActionStatusCopy.text"
        />
      </div>

      <template v-if="updateOsStatus === 'confirming' && !stateDataError">
        <div class="text-center flex flex-col gap-y-8px my-16px">
          <div class="flex flex-col gap-y-4px">
            <p class="text-18px">
              {{ $gettext(`Current Version: Unraid ${osVersion}`) }}
            </p>

            <ChevronDoubleDownIcon class="animate-pulse w-32px h-32px mx-auto fill-current opacity-50" />

            <p class="text-18px">
              {{ $gettext(`New Version: ${callbackUpdateRelease?.name}`) }}
            </p>

            <p
              v-if="!callbackUpdateRelease?.version?.includes('+')"
              class="text-14px italic opacity-75"
            >
              {{
                callbackTypeDowngrade
                  ? $gettext('This downgrade will require a reboot')
                  : $gettext('This update will require a reboot')
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
              :text="$gettext('Configure Connect Features')"
              @click="close"
            />
            <BrandButton
              v-else
              class="grow-0"
              :href="WEBGUI_CONNECT_SETTINGS.toString()"
              :icon="CogIcon"
              :text="$gettext('Configure Connect Features')"
            />
          </template>
        </template>

        <template v-if="updateOsStatus === 'confirming' && !stateDataError">
          <BrandButton
            variant="underline"
            :icon="XMarkIcon"
            :text="$gettext('Cancel')"
            @click="cancelUpdateOs"
          />
          <BrandButton
            :icon="CheckIcon"
            :text="
              callbackTypeDowngrade ? $gettext('Confirm and start downgrade') : $gettext('Confirm and start update')
            "
            @click="confirmUpdateOs"
          />
        </template>

        <template v-if="stateDataError">
          <BrandButton
            :href="WEBGUI_TOOLS_REGISTRATION.toString()"
            :icon="WrenchScrewdriverIcon"
            :text="$gettext('Fix Error')"
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
