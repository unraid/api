<script lang="ts" setup>
import { computed, h } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/24/solid';
import { Badge, BrandLoading, Button } from '@unraid/ui';
import { WEBGUI_TOOLS_REGISTRATION } from '~/helpers/urls';

import useDateTimeHelper from '~/composables/dateTime';
import { useAccountStore } from '~/store/account';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

export interface Props {
  downgradeNotAvailable?: boolean;
  showExternalDowngrade?: boolean;
  title?: string;
  subtitle?: string;
}
const props = withDefaults(defineProps<Props>(), {
  downgradeNotAvailable: false,
  showExternalDowngrade: false,
  title: undefined,
  subtitle: undefined,
});
const { t } = useI18n();

const accountStore = useAccountStore();
const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const LoadingIcon = () => h(BrandLoading, { variant: 'white', style: 'width: 16px; height: 16px;' });

const { dateTimeFormat, osVersion, rebootType, rebootVersion, regExp, regUpdatesExpired } =
  storeToRefs(serverStore);
const { available, availableWithRenewal } = storeToRefs(updateOsStore);
const { ineligibleText, rebootTypeText, status } = storeToRefs(updateOsActionsStore);

const updateAvailable = computed(() => available.value || availableWithRenewal.value);

const { outputDateTimeReadableDiff: readableDiffRegExp, outputDateTimeFormatted: formattedRegExp } =
  useDateTimeHelper(dateTimeFormat.value, t, true, regExp.value);

const regExpOutput = computed(() => {
  if (!regExp.value) {
    return undefined;
  }
  return {
    text: regUpdatesExpired.value
      ? `${t('registration.updateExpirationAction.eligibleForUpdatesReleasedOnOr', [formattedRegExp.value])} ${t('registration.updateExpirationAction.extendYourLicenseToAccessThe')}`
      : t('registration.updateExpirationAction.eligibleForFreeFeatureUpdatesUntil', [
          formattedRegExp.value,
        ]),
    title: regUpdatesExpired.value
      ? t('registration.updateExpirationAction.ineligibleAsOf', [readableDiffRegExp.value])
      : t('registration.updateExpirationAction.eligibleForFreeFeatureUpdatesFor', [
          readableDiffRegExp.value,
        ]),
  };
});

const showRebootButton = computed(
  () => rebootType.value === 'downgrade' || rebootType.value === 'update'
);

const checkButton = computed(() => {
  if (showRebootButton.value || props.showExternalDowngrade) {
    return {
      click: () => {
        if (props.showExternalDowngrade) {
          accountStore.downgradeOs();
        } else {
          accountStore.updateOs();
        }
      },
      icon: () => h(ArrowTopRightOnSquareIcon, { style: 'width: 16px; height: 16px;' }),
      text: t('updateOs.status.moreOptions'),
    };
  }

  if (!updateAvailable.value) {
    return {
      click: () => {
        updateOsStore.localCheckForUpdate();
      },
      icon: () => h(ArrowPathIcon, { style: 'width: 16px; height: 16px;' }),
      text: t('userProfile.dropdownContent.checkForUpdate'),
    };
  }

  return {
    variant: 'fill',
    click: () => {
      updateOsStore.setModalOpen(true);
    },
    icon: () => h(BellAlertIcon, { style: 'width: 16px; height: 16px;' }),
    text: availableWithRenewal.value
      ? t('headerOsVersion.unraidOsReleased', [availableWithRenewal.value])
      : t('headerOsVersion.unraidOsUpdateAvailable', [available.value]),
  };
});

const navigateToRegistration = () => {
  if (typeof window !== 'undefined') {
    window.location.href = WEBGUI_TOOLS_REGISTRATION;
  }
};
</script>

<template>
  <div class="grid gap-y-4">
    <header class="grid gap-y-1">
      <h1 v-if="title" class="text-2xl font-semibold">
        {{ title }}
      </h1>
      <h2 v-if="subtitle" class="text-xl">
        {{ subtitle }}
      </h2>
    </header>
    <div class="flex flex-col justify-start gap-4 md:flex-row md:items-start md:justify-between">
      <div class="inline-flex flex-wrap items-center justify-start gap-2">
        <Button
          variant="ghost"
          class="h-auto p-0 hover:bg-transparent"
          :title="t('updateOs.status.viewReleaseNotes')"
          @click="
            updateOsActionsStore.viewReleaseNotes(t('updateOs.downgrade.releaseNotes', [osVersion]))
          "
        >
          <Badge
            :icon="() => h(InformationCircleIcon, { style: 'width: 16px; height: 16px;' })"
            variant="gray"
            size="md"
          >
            {{ t('updateOs.checkUpdateResponseModal.currentVersion', [osVersion]) }}
          </Badge>
        </Button>

        <Button
          v-if="ineligibleText && !availableWithRenewal"
          variant="ghost"
          class="h-auto p-0 hover:bg-transparent"
          :title="t('updateOs.updateIneligible.learnMoreAndFix')"
          @click="navigateToRegistration"
        >
          <Badge
            variant="yellow"
            :icon="() => h(ExclamationTriangleIcon, { style: 'width: 16px; height: 16px;' })"
            :title="regExpOutput?.text"
            class="underline"
          >
            {{ t('updateOs.status.keyIneligibleForFutureReleases') }}
          </Badge>
        </Button>
        <Badge
          v-else-if="ineligibleText && availableWithRenewal"
          variant="yellow"
          :icon="ExclamationTriangleIcon"
          :title="regExpOutput?.text"
        >
          {{ t('updateOs.status.keyIneligibleFor', [availableWithRenewal]) }}
        </Badge>

        <Badge v-if="status === 'checking'" variant="orange" :icon="LoadingIcon">
          {{ t('updateOs.status.checking') }}
        </Badge>
        <template v-else>
          <Badge
            v-if="rebootType === ''"
            :variant="updateAvailable ? 'orange' : 'green'"
            :icon="
              updateAvailable
                ? () => h(BellAlertIcon, { style: 'width: 16px; height: 16px;' })
                : () => h(CheckCircleIcon, { style: 'width: 16px; height: 16px;' })
            "
          >
            {{
              available
                ? t('updateOs.status.unraidAvailable', [available])
                : availableWithRenewal
                  ? t('updateOs.status.upToDateWithEligibleReleases')
                  : t('updateOs.status.upToDate')
            }}
          </Badge>
          <Badge
            v-else
            variant="yellow"
            :icon="() => h(ExclamationTriangleIcon, { style: 'width: 16px; height: 16px;' })"
          >
            {{ t(rebootTypeText) }}
          </Badge>
        </template>

        <Badge
          v-if="downgradeNotAvailable"
          variant="gray"
          :icon="() => h(XCircleIcon, { style: 'width: 16px; height: 16px;' })"
        >
          {{ t('updateOs.status.noDowngradeAvailable') }}
        </Badge>
      </div>

      <div class="inline-flex shrink-0 grow flex-col items-center gap-4 md:items-end">
        <Button
          v-if="showRebootButton"
          variant="primary"
          :title="
            rebootType === 'downgrade'
              ? t('updateOs.status.rebootNowToDowngradeTo', [rebootVersion])
              : t('updateOs.status.rebootNowToUpdateTo', [rebootVersion])
          "
          @click="updateOsActionsStore.rebootServer()"
        >
          <ArrowPathIcon class="shrink-0" style="width: 16px; height: 16px" />
          {{
            rebootType === 'downgrade'
              ? t('updateOs.status.rebootNowToDowngradeTo', [rebootVersion])
              : t('updateOs.status.rebootNowToUpdateTo', [rebootVersion])
          }}
        </Button>

        <Button
          :variant="checkButton.variant === 'fill' ? 'pill-orange' : 'pill-gray'"
          :title="checkButton.text"
          :disabled="status === 'checking'"
          @click="checkButton.click"
        >
          <component :is="checkButton.icon" class="shrink-0" style="width: 16px; height: 16px" />
          {{ checkButton.text }}
        </Button>

        <Button
          v-if="rebootType !== ''"
          variant="pill-gray"
          :title="
            t('updateOs.status.cancel', [
              rebootType === 'downgrade' ? t('updateOs.status.downgrade') : t('updateOs.status.update'),
            ])
          "
          @click="updateOsStore.cancelUpdate()"
        >
          <XCircleIcon class="shrink-0" style="width: 16px; height: 16px" />
          {{
            t('updateOs.status.cancel', [
              rebootType === 'downgrade' ? t('updateOs.status.downgrade') : t('updateOs.status.update'),
            ])
          }}
        </Button>
      </div>
    </div>
  </div>
</template>
