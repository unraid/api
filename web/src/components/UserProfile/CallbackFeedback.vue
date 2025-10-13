<script lang="ts" setup>
// @todo ensure key installs and updateOs can be handled at the same time
// @todo with multiple actions of key install and update after successful key install, rather than showing default success message, show a message to have them confirm the update
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
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

import Modal from '~/components/Modal.vue';
import RegistrationUpdateExpiration from '~/components/Registration/UpdateExpiration.vue';
import UpcCallbackFeedbackStatus from '~/components/UserProfile/CallbackFeedbackStatus.vue';
import UpcUptimeExpire from '~/components/UserProfile/UptimeExpire.vue';
import { useAccountStore } from '~/store/account';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useInstallKeyStore } from '~/store/installKey';
import { useServerStore } from '~/store/server';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

export interface Props {
  open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});
const { t } = useI18n();

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
      ? t('userProfile.callbackFeedback.downgradeUnraidOsConfirmationRequired')
      : t('userProfile.callbackFeedback.updateUnraidOsConfirmationRequired');
  }
  switch (callbackStatus.value) {
    case 'error':
      return t('common.error');
    case 'loading':
      return t('userProfile.callbackFeedback.performingActions');
    case 'success':
      return t('common.success');
  }
  return '';
});
const subheading = computed(() => {
  if (updateOsStatus.value === 'confirming') {
    return callbackTypeDowngrade.value
      ? t('userProfile.callbackFeedback.pleaseConfirmTheDowngradeDetailsBelow')
      : t('userProfile.callbackFeedback.pleaseConfirmTheUpdateDetailsBelow');
  }
  if (callbackStatus.value === 'error') {
    return t('userProfile.callbackFeedback.somethingWentWrong'); /** @todo show actual error messages */
  }
  if (callbackStatus.value === 'loading') {
    return t('userProfile.callbackFeedback.pleaseKeepThisWindowOpenWhile');
  }
  if (callbackStatus.value === 'success') {
    if (accountActionType.value === 'signIn') {
      return t('userProfile.callbackFeedback.youReOneStepCloserTo');
    }
    if (keyActionType.value === 'purchase') {
      return t('userProfile.callbackFeedback.thankYouForPurchasingAnUnraid', [keyType.value]);
    }
    if (keyActionType.value === 'replace') {
      return t('userProfile.callbackFeedback.yourKeyHasBeenReplaced', [keyType.value]);
    }
    if (keyActionType.value === 'trialExtend') {
      return t('userProfile.callbackFeedback.yourTrialKeyHasBeenExtended');
    }
    if (keyActionType.value === 'trialStart') {
      return t('userProfile.callbackFeedback.yourFreeTrialKeyProvidesAll');
    }
    if (keyActionType.value === 'upgrade') {
      return t('userProfile.callbackFeedback.thankYouForUpgradingToAn', [keyType.value]);
    }
    return '';
  }
  return '';
});

const closeText = computed(() => t('common.close')); // !connectPluginInstalled.value ? t('userProfile.callbackFeedback.noThanks') :
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
  let txt1 = t('common.installing');
  let txt2 = t('common.installed');
  let txt3 = t('common.install');
  switch (keyInstallStatus.value) {
    case 'installing':
      if (keyActionType.value === 'trialExtend') {
        txt1 = t('userProfile.callbackFeedback.installingExtendedTrial');
      }
      if (keyActionType.value === 'recover') {
        txt1 = t('userProfile.callbackFeedback.installingRecovered');
      }
      if (keyActionType.value === 'renew') {
        txt1 = t('userProfile.callbackFeedback.installingExtended');
      }
      if (keyActionType.value === 'replace') {
        txt1 = t('userProfile.callbackFeedback.installingReplaced');
      }
      return {
        text: t('userProfile.callbackFeedback.key', [txt1, keyType.value]),
      };
    case 'success':
      if (keyActionType.value === 'renew' || keyActionType.value === 'trialExtend') {
        txt2 = t('userProfile.callbackFeedback.extensionInstalled');
      }
      if (keyActionType.value === 'recover') {
        txt2 = t('userProfile.callbackFeedback.recovered');
      }
      if (keyActionType.value === 'replace') {
        txt2 = t('userProfile.callbackFeedback.replaced');
      }
      return {
        text: t('userProfile.callbackFeedback.keySuccessfully', [txt2, keyType.value]),
      };
    case 'failed':
      if (keyActionType.value === 'trialExtend') {
        txt3 = t('userProfile.callbackFeedback.installExtended');
      }
      if (keyActionType.value === 'recover') {
        txt3 = t('userProfile.callbackFeedback.installRecovered');
      }
      if (keyActionType.value === 'replace') {
        txt3 = t('userProfile.callbackFeedback.installReplaced');
      }
      return {
        text: t('userProfile.callbackFeedback.failedToKey', [txt3, keyType.value]),
      };
    case 'ready':
    default:
      return {
        text: t('userProfile.callbackFeedback.readyToInstallKey'),
      };
  }
});

const accountActionStatusCopy = computed((): { text: string } => {
  switch (accountActionStatus.value) {
    case 'waiting':
      return {
        text:
          accountAction.value?.type === 'signIn'
            ? t('userProfile.callbackFeedback.signingIn2')
            : t('userProfile.callbackFeedback.signingOut2'),
      };
    case 'updating':
      return {
        text:
          accountAction.value?.type === 'signIn'
            ? t('userProfile.callbackFeedback.signingIn', [accountAction.value.user?.preferred_username])
            : t('userProfile.callbackFeedback.signingOut', [username.value]),
      };
    case 'success':
      return {
        text:
          accountAction.value?.type === 'signIn'
            ? t('userProfile.callbackFeedback.signedInSuccessfully', [
                accountAction.value.user?.preferred_username,
              ])
            : t('userProfile.callbackFeedback.signedOutSuccessfully', [username.value]),
      };
    case 'failed':
      return {
        text:
          accountAction.value?.type === 'signIn'
            ? t('userProfile.callbackFeedback.signInFailed')
            : t('userProfile.callbackFeedback.signOutFailed'),
      };
    case 'ready':
    default:
      return {
        text: t('userProfile.callbackFeedback.readyToUpdateConnectAccountConfiguration'),
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
    max-width="max-w-[640px]"
    :error="callbackStatus === 'error'"
    :success="callbackStatus === 'success'"
    :show-close-x="callbackStatus !== 'loading'"
    @close="close"
  >
    <template #main>
      <div
        v-if="keyInstallStatus !== 'ready' || accountActionStatus !== 'ready'"
        class="relative flex w-full flex-col justify-center gap-y-4 py-6 text-center"
      >
        <BrandLoading v-if="callbackStatus === 'loading'" class="mx-auto w-[110px]" />

        <UpcCallbackFeedbackStatus
          v-if="keyInstallStatus !== 'ready'"
          :success="keyInstallStatus === 'success'"
          :error="keyInstallStatus === 'failed'"
          :text="keyInstallStatusCopy.text"
        >
          <div v-if="keyType === 'Trial'" class="mt-1 italic opacity-75">
            <UpcUptimeExpire v-if="refreshServerStateStatus === 'done'" :for-expire="true" />
            <p v-else>
              {{ t('userProfile.callbackFeedback.calculatingTrialExpiration') }}
            </p>
          </div>
          <div v-if="showUpdateEligibility" class="mt-1 italic opacity-75">
            <RegistrationUpdateExpiration v-if="refreshServerStateStatus === 'done'" />
            <p v-else>
              {{ t('userProfile.callbackFeedback.calculatingOsUpdateEligibility') }}
            </p>
          </div>

          <template v-if="keyInstallStatus === 'failed'">
            <div v-if="isSupported" class="flex justify-center">
              <BrandButton
                :icon="ClipboardIcon"
                :text="copied ? t('common.copied') : t('userProfile.callbackFeedback.copyKeyUrl')"
                @click="copy(keyUrl)"
              />
            </div>
            <p v-else>
              {{ t('userProfile.callbackFeedback.copyYourKeyUrl', [keyUrl]) }}
            </p>
            <p>
              <a
                href="/Tools/Registration"
                class="underline opacity-75 transition hover:opacity-100 focus:opacity-100"
              >
                {{ t('userProfile.callbackFeedback.thenGoToToolsRegistrationTo') }}
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
          :text="t('userProfile.callbackFeedback.postInstallLicenseKeyError')"
        >
          <h4 class="text-left text-lg font-semibold">
            {{ t(stateData.heading) }}
          </h4>
          <div class="text-left text-base" v-html="t(stateData.message)" />
        </UpcCallbackFeedbackStatus>

        <UpcCallbackFeedbackStatus
          v-if="accountActionStatus !== 'ready' && !accountActionHide"
          :success="accountActionStatus === 'success'"
          :error="accountActionStatus === 'failed'"
          :text="accountActionStatusCopy.text"
        />
      </div>

      <template v-if="updateOsStatus === 'confirming' && !stateDataError">
        <div class="my-4 flex flex-col gap-y-2">
          <div class="flex flex-col gap-y-1">
            <p class="text-center text-lg">
              {{ t('userProfile.callbackFeedback.currentVersionUnraid', [osVersion]) }}
            </p>

            <ChevronDoubleDownIcon class="mx-auto h-8 w-8 animate-pulse fill-current opacity-50" />

            <p class="text-center text-lg">
              {{ t('userProfile.callbackFeedback.newVersion', [callbackUpdateRelease?.name]) }}
            </p>

            <p
              v-if="!callbackUpdateRelease?.version?.includes('+')"
              class="text-center text-sm italic opacity-75"
            >
              {{
                callbackTypeDowngrade
                  ? t('userProfile.callbackFeedback.thisDowngradeWillRequireAReboot')
                  : t('userProfile.callbackFeedback.thisUpdateWillRequireAReboot')
              }}
            </p>
          </div>
        </div>
      </template>
    </template>

    <template v-if="callbackStatus === 'success' || updateOsStatus === 'confirming'" #footer>
      <div class="flex flex-row justify-center gap-4">
        <template v-if="callbackStatus === 'success'">
          <BrandButton variant="underline" :icon="XMarkIcon" :text="closeText" @click="close" />

          <template v-if="connectPluginInstalled && accountActionType === 'signIn'">
            <BrandButton
              v-if="isSettingsPage"
              class="grow-0"
              :icon="CogIcon"
              :text="t('userProfile.callbackFeedback.configureConnectFeatures')"
              @click="close"
            />
            <BrandButton
              v-else
              class="grow-0"
              :href="WEBGUI_CONNECT_SETTINGS.toString()"
              :icon="CogIcon"
              :text="t('userProfile.callbackFeedback.configureConnectFeatures')"
            />
          </template>
        </template>

        <template v-if="updateOsStatus === 'confirming' && !stateDataError">
          <BrandButton
            variant="underline"
            :icon="XMarkIcon"
            :text="t('common.cancel')"
            @click="cancelUpdateOs"
          />
          <BrandButton
            :icon="CheckIcon"
            :text="
              callbackTypeDowngrade
                ? t('userProfile.callbackFeedback.confirmAndStartDowngrade')
                : t('userProfile.callbackFeedback.confirmAndStartUpdate')
            "
            @click="confirmUpdateOs"
          />
        </template>

        <template v-if="stateDataError">
          <BrandButton
            :href="WEBGUI_TOOLS_REGISTRATION.toString()"
            :icon="WrenchScrewdriverIcon"
            :text="t('userProfile.callbackFeedback.fixError')"
          />
        </template>
      </div>
    </template>
  </Modal>
</template>
