<script lang="ts" setup>
/**
 * @todo how are we going to update test, beta, and stable releases for internal testing?
 * @todo after install / downgrade detect if third-party drivers are installed and tell users to wait for a user to wait for a new notification
 *
 * run exec("ps aux | grep -E "inotifywait -q /boot/changes.txt -e move_self,delete_self" | grep -v "grep -E inotifywait" | awk '{print $2}'");
 * if this returns are value assume we have third-party drivers installed and tell the user to wait for a new notification
 *
 * view https://s3.amazonaws.com/dnld.lime-technology.com/stable/unRAIDServer.plg to see how the update is handled
# ensure writes to USB flash boot device have completed
sync -f /boot
if [ -z "${plg_update_helper}" ]; then
  echo "Update successful - PLEASE REBOOT YOUR SERVER"
else
  echo "Third party plugins found - PLEASE CHECK YOUR UNRAID NOTIFICATIONS AND WAIT FOR THE MESSAGE THAT IT IS SAFE TO REBOOT!"
fi
 */
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/vue/24/solid';
import { BrandButton, CardWrapper, PageContainer, SettingsGrid } from '@unraid/ui';

import type { RegistrationItemProps } from '~/types/registration';
import type { ServerStateDataAction } from '~/types/server';

import KeyActions from '~/components/KeyActions.vue';
import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import RegistrationActivationCode from '~/components/Registration/ActivationCode.vue';
import RegistrationKeyLinkedStatus from '~/components/Registration/KeyLinkedStatus.vue';
import RegistrationReplaceCheck from '~/components/Registration/ReplaceCheck.vue';
import RegistrationUpdateExpirationAction from '~/components/Registration/UpdateExpirationAction.vue';
import UserProfileUptimeExpire from '~/components/UserProfile/UptimeExpire.vue';
import useDateTimeHelper from '~/composables/dateTime';
import { useReplaceRenewStore } from '~/store/replaceRenew';
import { useServerStore } from '~/store/server';

const { t } = useI18n();

const replaceRenewCheckStore = useReplaceRenewStore();
const serverStore = useServerStore();
const { activationCode } = storeToRefs(useActivationCodeDataStore());

const {
  computedArray,
  arrayWarning,
  authAction,
  dateTimeFormat,
  deviceCount,
  guid,
  flashVendor,
  flashProduct,
  keyActions,
  keyfile,
  computedRegDevs,
  regGuid,
  regTm,
  regTo,
  regTy,
  regExp,
  regUpdatesExpired,
  serverErrors,
  state,
  stateData,
  stateDataError,
  tooManyDevices,
} = storeToRefs(serverStore);

const formattedRegTm = ref<string>();
/**
 * regTm may not have a value until we get a response from the refreshServerState action
 * So we need to watch for this value to be able to format it based on the user's date time preferences.
 */
const setFormattedRegTm = () => {
  if (!regTm.value) {
    return;
  }

  const { outputDateTimeFormatted } = useDateTimeHelper(dateTimeFormat.value, t, true, regTm.value);
  formattedRegTm.value = outputDateTimeFormatted.value;
};
watch(regTm, (_newV) => {
  setFormattedRegTm();
});
onBeforeMount(() => {
  setFormattedRegTm();
  /** automatically check for replacement and renewal eligibility…will prompt user if eligible for a renewal / key re-roll for legacy keys */
  if (guid.value && keyfile.value) {
    replaceRenewCheckStore.check();
  }
});

const headingIcon = computed(() =>
  serverErrors.value.length ? ShieldExclamationIcon : ShieldCheckIcon
);
const heading = computed(() => {
  if (serverErrors.value.length) {
    // It's rare to have multiple errors but for the time being only show the first error
    return serverErrors.value[0]?.heading;
  }
  return stateData.value.heading;
});
const subheading = computed(() => {
  if (serverErrors.value.length) {
    // It's rare to have multiple errors but for the time being only show the first error
    return serverErrors.value[0]?.message;
  }
  return stateData.value.message;
});

const showTrialExpiration = computed(
  (): boolean => state.value === 'TRIAL' || state.value === 'EEXPIRED'
);
const showUpdateEligibility = computed((): boolean => !!regExp.value);
const keyInstalled = computed((): boolean => !!(!stateDataError.value && state.value !== 'ENOKEYFILE'));
const showLinkedAndTransferStatus = computed(
  (): boolean => !!(keyInstalled.value && guid.value && !showTrialExpiration.value)
);
// filter out renew action and only display other key actions…renew is displayed in RegistrationUpdateExpirationAction
const showFilteredKeyActions = computed(
  (): boolean =>
    !!(
      keyActions.value &&
      keyActions.value?.filter((action: ServerStateDataAction) => !['renew'].includes(action.name))
        .length > 0
    )
);
const showPartnerActivationCode = computed(() => {
  const currentState = state.value;
  return (
    Boolean(activationCode.value?.code) &&
    (currentState === 'ENOKEYFILE' || currentState === 'TRIAL' || currentState === 'EEXPIRED')
  );
});

// Organize items into three sections
const flashDriveItems = computed((): RegistrationItemProps[] => {
  return [
    ...(guid.value
      ? [
          {
            label: t('registration.flashGuid'),
            text: guid.value,
          },
        ]
      : []),
    ...(flashVendor.value
      ? [
          {
            label: t('registration.flashVendor'),
            text: flashVendor.value,
          },
        ]
      : []),
    ...(flashProduct.value
      ? [
          {
            label: t('registration.flashProduct'),
            text: flashProduct.value,
          },
        ]
      : []),
    ...(state.value === 'EGUID'
      ? [
          {
            label: t('registration.registeredGuid'),
            text: regGuid.value,
          },
        ]
      : []),
  ];
});

const licenseItems = computed((): RegistrationItemProps[] => {
  return [
    ...(computedArray.value
      ? [
          {
            label: t('registration.arrayStatus'),
            text: computedArray.value,
            warning: arrayWarning.value,
          },
        ]
      : []),
    ...(regTy.value
      ? [
          {
            label: t('registration.licenseKeyType'),
            text: regTy.value,
          },
        ]
      : []),
    ...(regTo.value
      ? [
          {
            label: t('registration.registeredTo'),
            text: regTo.value,
          },
        ]
      : []),
    ...(regTo.value && regTm.value && formattedRegTm.value
      ? [
          {
            label: t('registration.registeredOn'),
            text: formattedRegTm.value,
          },
        ]
      : []),
    ...(showTrialExpiration.value
      ? [
          {
            error: state.value === 'EEXPIRED',
            label: t('registration.trialExpiration'),
            component: UserProfileUptimeExpire,
            componentProps: {
              forExpire: true,
              shortText: true,
              t,
            },
            componentOpacity: true,
          },
        ]
      : []),
    ...(showUpdateEligibility.value
      ? [
          {
            label: t('registration.osUpdateEligibility'),
            warning: regUpdatesExpired.value,
            component: RegistrationUpdateExpirationAction,
            componentOpacity: !regUpdatesExpired.value,
          },
        ]
      : []),
    ...(keyInstalled.value
      ? [
          {
            error: tooManyDevices.value,
            label: t('registration.attachedStorageDevices'),
            text: tooManyDevices.value
              ? t('registration.outOfAllowedDevicesUpgradeYour', [
                  deviceCount.value,
                  computedRegDevs.value,
                ])
              : t('registration.outOfDevices', [
                  deviceCount.value,
                  computedRegDevs.value === -1 ? t('registration.unlimited') : computedRegDevs.value,
                ]),
          },
        ]
      : []),
  ];
});

const actionItems = computed((): RegistrationItemProps[] => {
  return [
    ...(showPartnerActivationCode.value && activationCode.value?.code
      ? [
          {
            label: t('registration.activationCode'),
            component: RegistrationActivationCode,
            componentProps: {
              code: activationCode.value.code,
            },
          },
        ]
      : []),
    ...(showLinkedAndTransferStatus.value
      ? [
          {
            label: t('registration.transferLicenseToNewFlash'),
            component: RegistrationReplaceCheck,
            componentProps: { t },
          },
        ]
      : []),
    ...(regTo.value && showLinkedAndTransferStatus.value
      ? [
          {
            label: t('registration.linkedToUnraidNetAccount'),
            component: RegistrationKeyLinkedStatus,
            componentProps: { t },
          },
        ]
      : []),
    ...(showFilteredKeyActions.value
      ? [
          {
            component: KeyActions,
            componentProps: {
              filterOut: ['renew'],
              t,
            },
          },
        ]
      : []),
  ];
});
</script>

<template>
  <div>
    <PageContainer class="max-w-[800px]">
      <CardWrapper :increased-padding="true">
        <div class="flex flex-col gap-5 sm:gap-6">
          <header class="flex flex-col gap-y-4">
            <h3
              class="flex flex-row items-center gap-2 text-xl leading-normal font-semibold md:text-2xl"
              :class="serverErrors.length ? 'text-unraid-red' : 'text-green-500'"
            >
              <component :is="headingIcon" class="h-6 w-6" />
              <span>
                {{ heading }}
              </span>
            </h3>
            <div
              v-if="subheading"
              class="prose text-base leading-relaxed whitespace-normal opacity-75"
              v-html="subheading"
            />
            <span v-if="authAction" class="grow-0">
              <BrandButton
                :disabled="authAction?.disabled"
                :icon="authAction.icon"
                :text="t(authAction.text)"
                :title="authAction.title ? t(authAction.title) : undefined"
                @click="authAction.click?.()"
              />
            </span>
          </header>

          <!-- Flash Drive Section -->
          <div
            v-if="flashDriveItems.length > 0"
            class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
          >
            <h4 class="mb-3 text-lg font-semibold">{{ t('registration.flashDrive') }}</h4>
            <SettingsGrid>
              <template v-for="item in flashDriveItems" :key="item.label">
                <div class="flex items-center gap-x-2 font-semibold">
                  <ShieldExclamationIcon v-if="item.error" class="text-unraid-red h-4 w-4" />
                  <span v-html="item.label" />
                </div>
                <div class="select-all" :class="[item.error ? 'text-unraid-red' : 'opacity-75']">
                  {{ item.text }}
                </div>
              </template>
            </SettingsGrid>
          </div>

          <!-- License Section -->
          <div
            v-if="licenseItems.length > 0"
            class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
          >
            <h4 class="mb-3 text-lg font-semibold">{{ t('registration.license') }}</h4>
            <SettingsGrid>
              <template v-for="item in licenseItems" :key="item.label">
                <div class="flex items-center gap-x-2 font-semibold">
                  <ShieldExclamationIcon v-if="item.error" class="text-unraid-red h-4 w-4" />
                  <span v-html="item.label" />
                </div>
                <div
                  :class="[
                    item.error ? 'text-unraid-red' : item.warning ? 'text-yellow-600' : '',
                    item.text && !item.error && !item.warning ? 'opacity-75' : '',
                  ]"
                >
                  <span v-if="item.text" class="select-all">
                    {{ item.text }}
                  </span>
                  <component
                    :is="item.component"
                    v-if="item.component"
                    v-bind="item.componentProps"
                    :class="[item.componentOpacity && !item.error ? 'opacity-75' : '']"
                  />
                </div>
              </template>
            </SettingsGrid>
          </div>

          <!-- Actions Section -->
          <div
            v-if="actionItems.length > 0"
            class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
          >
            <h4 class="mb-3 text-lg font-semibold">{{ t('registration.actions') }}</h4>
            <blockquote
              v-if="showPartnerActivationCode"
              class="border-primary bg-primary/10 mb-4 border-l-4 p-4"
            >
              <p class="text-highlighted text-sm leading-relaxed font-medium">
                {{ t('registration.partnerActivationDetected') }}
              </p>
            </blockquote>
            <SettingsGrid>
              <template
                v-for="item in actionItems"
                :key="item.label || 'action-' + actionItems.indexOf(item)"
              >
                <template v-if="item.label">
                  <template v-if="item.component === RegistrationActivationCode">
                    <div class="md:col-span-2">
                      <div class="flex min-w-0 flex-wrap items-center gap-2">
                        <div class="flex items-center gap-x-2 font-semibold">
                          <ShieldExclamationIcon v-if="item.error" class="text-unraid-red h-4 w-4" />
                          <span v-html="item.label" />
                          <span>:</span>
                        </div>
                        <div :class="[item.error ? 'text-unraid-red' : '']">
                          <component
                            :is="item.component"
                            v-if="item.component"
                            v-bind="item.componentProps"
                            :class="[item.componentOpacity && !item.error ? 'opacity-75' : '']"
                          />
                        </div>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="flex items-center gap-x-2 font-semibold">
                      <ShieldExclamationIcon v-if="item.error" class="text-unraid-red h-4 w-4" />
                      <span v-html="item.label" />
                    </div>
                    <div :class="[item.error ? 'text-unraid-red' : '']">
                      <span v-if="item.text" class="opacity-75 select-all">
                        {{ item.text }}
                      </span>
                      <component
                        :is="item.component"
                        v-if="item.component"
                        v-bind="item.componentProps"
                        :class="[item.componentOpacity && !item.error ? 'opacity-75' : '']"
                      />
                    </div>
                  </template>
                </template>
                <template v-else>
                  <div class="md:col-span-2">
                    <component :is="item.component" v-bind="item.componentProps" />
                  </div>
                </template>
              </template>
            </SettingsGrid>
          </div>
        </div>
      </CardWrapper>
    </PageContainer>
  </div>
</template>
