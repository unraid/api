<script lang="ts" setup>
import { computed, h } from 'vue';
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

import type { ComposerTranslation } from 'vue-i18n';

import useDateTimeHelper from '~/composables/dateTime';
import { useAccountStore } from '~/store/account';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

export interface Props {
  downgradeNotAvailable?: boolean;
  restoreVersion?: string | undefined;
  showExternalDowngrade?: boolean;
  t: ComposerTranslation;
  title?: string;
  subtitle?: string;
}
const props = withDefaults(defineProps<Props>(), {
  downgradeNotAvailable: false,
  restoreVersion: undefined,
  showExternalDowngrade: false,
  title: undefined,
  subtitle: undefined,
});

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
  useDateTimeHelper(dateTimeFormat.value, props.t, true, regExp.value);

const regExpOutput = computed(() => {
  if (!regExp.value) {
    return undefined;
  }
  return {
    text: regUpdatesExpired.value
      ? `${props.t('Eligible for updates released on or before {0}.', [formattedRegExp.value])} ${props.t('Extend your license to access the latest updates.')}`
      : props.t('Eligible for free feature updates until {0}', [formattedRegExp.value]),
    title: regUpdatesExpired.value
      ? props.t('Ineligible as of {0}', [readableDiffRegExp.value])
      : props.t('Eligible for free feature updates for {0}', [readableDiffRegExp.value]),
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
      text: props.t('More options'),
    };
  }

  if (!updateAvailable.value) {
    return {
      click: () => {
        updateOsStore.localCheckForUpdate();
      },
      icon: () => h(ArrowPathIcon, { style: 'width: 16px; height: 16px;' }),
      text: props.t('Check for Update'),
    };
  }

  return {
    variant: 'fill',
    click: () => {
      updateOsStore.setModalOpen(true);
    },
    icon: () => h(BellAlertIcon, { style: 'width: 16px; height: 16px;' }),
    text: availableWithRenewal.value
      ? props.t('Unraid OS {0} Released', [availableWithRenewal.value])
      : props.t('Unraid OS {0} Update Available', [available.value]),
  };
});

const navigateToRegistration = () => {
  if (typeof window !== 'undefined') {
    window.location.href = WEBGUI_TOOLS_REGISTRATION.toString();
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
    <div class="flex flex-col md:flex-row gap-4 justify-start md:items-start md:justify-between">
      <div class="inline-flex flex-wrap justify-start items-center gap-2">
        <Button
          variant="ghost"
          class="p-0 h-auto hover:bg-transparent"
          :title="t('View release notes')"
          @click="updateOsActionsStore.viewReleaseNotes(t('{0} Release Notes', [osVersion]))"
        >
          <Badge :icon="() => h(InformationCircleIcon, { style: 'width: 16px; height: 16px;' })" variant="gray" size="md">
            {{ t('Current Version {0}', [osVersion]) }}
          </Badge>
        </Button>

        <Button
          v-if="ineligibleText && !availableWithRenewal"
          variant="ghost"
          class="p-0 h-auto hover:bg-transparent"
          :title="t('Learn more and fix')"
          @click="navigateToRegistration"
        >
          <Badge
            variant="yellow"
            :icon="() => h(ExclamationTriangleIcon, { style: 'width: 16px; height: 16px;' })"
            :title="regExpOutput?.text"
            class="underline"
          >
            {{ t('Key ineligible for future releases') }}
          </Badge>
        </Button>
        <Badge
          v-else-if="ineligibleText && availableWithRenewal"
          variant="yellow"
          :icon="ExclamationTriangleIcon"
          :title="regExpOutput?.text"
        >
          {{ t('Key ineligible for {0}', [availableWithRenewal]) }}
        </Badge>

        <Badge v-if="status === 'checking'" variant="orange" :icon="LoadingIcon">
          {{ t('Checking...') }}
        </Badge>
        <template v-else>
          <Badge
            v-if="rebootType === ''"
            :variant="updateAvailable ? 'orange' : 'green'"
            :icon="updateAvailable ? () => h(BellAlertIcon, { style: 'width: 16px; height: 16px;' }) : () => h(CheckCircleIcon, { style: 'width: 16px; height: 16px;' })"
          >
            {{
              available
                ? t('Unraid {0} Available', [available])
                : availableWithRenewal
                  ? t('Up-to-date with eligible releases')
                  : t('Up-to-date')
            }}
          </Badge>
          <Badge v-else variant="yellow" :icon="() => h(ExclamationTriangleIcon, { style: 'width: 16px; height: 16px;' })">
            {{ t(rebootTypeText) }}
          </Badge>
        </template>

        <Badge v-if="downgradeNotAvailable" variant="gray" :icon="() => h(XCircleIcon, { style: 'width: 16px; height: 16px;' })">
          {{ t('No downgrade available') }}
        </Badge>
      </div>

      <div class="inline-flex flex-col shrink-0 gap-4 grow items-center md:items-end">
        <Button
          v-if="showRebootButton"
          variant="primary"
          :title="
            rebootType === 'downgrade'
              ? t('Reboot Now to Downgrade to {0}', [rebootVersion])
              : t('Reboot Now to Update to {0}', [rebootVersion])
          "
          @click="updateOsActionsStore.rebootServer()"
        >
          <ArrowPathIcon class="shrink-0" style="width: 16px; height: 16px;" />
          {{
            rebootType === 'downgrade'
              ? t('Reboot Now to Downgrade to {0}', [rebootVersion])
              : t('Reboot Now to Update to {0}', [rebootVersion])
          }}
        </Button>

        <Button
          :variant="checkButton.variant === 'fill' ? 'pill-orange' : 'pill-gray'"
          :title="checkButton.text"
          :disabled="status === 'checking'"
          @click="checkButton.click"
        >
          <component :is="checkButton.icon" class="shrink-0" style="width: 16px; height: 16px;" />
          {{ checkButton.text }}
        </Button>

        <Button
          v-if="rebootType !== ''"
          variant="pill-gray"
          :title="t('Cancel {0}', [rebootType === 'downgrade' ? t('Downgrade') : t('Update')])"
          @click="updateOsStore.cancelUpdate()"
        >
          <XCircleIcon class="shrink-0" style="width: 16px; height: 16px;" />
          {{ t('Cancel {0}', [rebootType === 'downgrade' ? t('Downgrade') : t('Update')]) }}
        </Button>
      </div>
    </div>
  </div>
</template>
