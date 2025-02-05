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
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';

import type { RegistrationItemProps } from '~/types/registration';

import KeyActions from '~/components/KeyActions.vue';
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
      keyActions.value?.filter((action) => !['renew'].includes(action.name)).length > 0
    )
);

const items = computed((): RegistrationItemProps[] => {
  return [
    ...(computedArray.value
      ? [
          {
            label: t('Array status'),
            text: computedArray.value,
            warning: arrayWarning.value,
          },
        ]
      : []),
    ...(regTy.value
      ? [
          {
            label: t('License key type'),
            text: regTy.value,
          },
        ]
      : []),
    ...(showTrialExpiration.value
      ? [
          {
            error: state.value === 'EEXPIRED',
            label: t('Trial expiration'),
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
    ...(regTo.value
      ? [
          {
            label: t('Registered to'),
            text: regTo.value,
          },
        ]
      : []),
    ...(regTo.value && regTm.value && formattedRegTm.value
      ? [
          {
            label: t('Registered on'),
            text: formattedRegTm.value,
          },
        ]
      : []),
    ...(showUpdateEligibility.value
      ? [
          {
            label: t('OS Update Eligibility'),
            warning: regUpdatesExpired.value,
            component: RegistrationUpdateExpirationAction,
            componentProps: { t },
            componentOpacity: !regUpdatesExpired.value,
          },
        ]
      : []),
    ...(state.value === 'EGUID'
      ? [
          {
            label: t('Registered GUID'),
            text: regGuid.value,
          },
        ]
      : []),
    ...(guid.value
      ? [
          {
            label: t('Flash GUID'),
            text: guid.value,
          },
        ]
      : []),
    ...(flashVendor.value
      ? [
          {
            label: t('Flash Vendor'),
            text: flashVendor.value,
          },
        ]
      : []),
    ...(flashProduct.value
      ? [
          {
            label: t('Flash Product'),
            text: flashProduct.value,
          },
        ]
      : []),
    ...(keyInstalled.value
      ? [
          {
            error: tooManyDevices.value,
            label: t('Attached Storage Devices'),
            text: tooManyDevices.value
              ? t('{0} out of {1} allowed devices – upgrade your key to support more devices', [
                  deviceCount.value,
                  computedRegDevs.value,
                ])
              : t('{0} out of {1} devices', [
                  deviceCount.value,
                  computedRegDevs.value === -1 ? t('unlimited') : computedRegDevs.value,
                ]),
          },
        ]
      : []),
    ...(showLinkedAndTransferStatus.value
      ? [
          {
            label: t('Transfer License to New Flash'),
            component: RegistrationReplaceCheck,
            componentProps: { t },
          },
        ]
      : []),
    ...(regTo.value && showLinkedAndTransferStatus.value
      ? [
          {
            label: t('Linked to Unraid.net account'),
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
  <UiPageContainer class="max-w-800px">
    <UiCardWrapper :increased-padding="true">
      <div class="flex flex-col gap-20px sm:gap-24px">
        <header class="flex flex-col gap-y-16px">
          <h3
            class="text-20px md:text-24px font-semibold leading-normal flex flex-row items-center gap-8px"
            :class="serverErrors.length ? 'text-unraid-red' : 'text-green-500'"
          >
            <component :is="headingIcon" class="w-24px h-24px" />
            <span>
              {{ heading }}
            </span>
          </h3>
          <div
            v-if="subheading"
            class="prose text-16px leading-relaxed whitespace-normal opacity-75"
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
        <dl>
          <RegistrationItem
            v-for="item in items"
            :key="item.label"
            :component="item?.component"
            :component-props="item?.componentProps"
            :error="item.error ?? false"
            :warning="item.warning ?? false"
            :label="item.label"
            :text="item.text"
          >
            <template v-if="item.component" #right>
              <component
                :is="item.component"
                v-bind="item.componentProps"
                :class="[item.componentOpacity && !item.error ? 'opacity-75' : '']"
              />
            </template>
          </RegistrationItem>
        </dl>
      </div>
    </UiCardWrapper>
  </UiPageContainer>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '../assets/main.css';
</style>
