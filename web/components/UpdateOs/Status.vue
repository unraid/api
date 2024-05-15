<script lang="ts" setup>
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';

import { WEBGUI_TOOLS_REGISTRATION } from '~/helpers/urls';
import useDateTimeHelper from '~/composables/dateTime';
import { useAccountStore } from '~/store/account';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';
import type { ButtonProps } from '~/types/ui/button';
import type { ComposerTranslation } from 'vue-i18n';

import BrandLoadingWhite from '~/components/Brand/LoadingWhite.vue';

export interface Props {
  downgradeNotAvailable?: boolean;
  restoreVersion?: string | undefined;
  showUpdateCheck?: boolean;
  t: ComposerTranslation;
  title?: string;
  subtitle?: string;
}
const props = withDefaults(defineProps<Props>(), {
  downgradeNotAvailable: false,
  restoreVersion: undefined,
  showUpdateCheck: false,
  title: undefined,
  subtitle: undefined,
});

const accountStore = useAccountStore();
const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { dateTimeFormat, osVersion, rebootType, rebootVersion, regExp, regUpdatesExpired } = storeToRefs(serverStore);
const { available, availableWithRenewal } = storeToRefs(updateOsStore);
const { ineligibleText, rebootTypeText, status } = storeToRefs(updateOsActionsStore);

const updateAvailable = computed(() => available.value || availableWithRenewal.value);

const {
  outputDateTimeReadableDiff: readableDiffRegExp,
  outputDateTimeFormatted: formattedRegExp,
} = useDateTimeHelper(dateTimeFormat.value, props.t, true, regExp.value);

const regExpOutput = computed(() => {
  if (!regExp.value) {
    return undefined;
  }
  return {
    text: regUpdatesExpired.value
      ? props.t('Ineligible for feature updates released after {0}', [formattedRegExp.value])
      : props.t('Eligible for free feature updates until {0}', [formattedRegExp.value]),
    title: regUpdatesExpired.value
      ? props.t('Ineligible as of {0}', [readableDiffRegExp.value])
      : props.t('Eligible for free feature updates for {0}', [readableDiffRegExp.value]),
  };
});

const showRebootButton = computed(() => rebootType.value === 'downgrade' || rebootType.value === 'update');

const checkButton = computed((): ButtonProps => {
  if (showRebootButton.value) {
    return {
      btnStyle: 'outline',
      click: () => {
        accountStore.updateOs();
      },
      icon: ArrowTopRightOnSquareIcon,
      text: props.t('More options'),
    };
  }

  if (!updateAvailable.value) {
    return {
      btnStyle: 'outline',
      click: () => {
        updateOsStore.localCheckForUpdate();
      },
      icon: ArrowPathIcon,
      text: props.t('Check for Update'),
    };
  }

  return {
    btnStyle: 'fill',
    click: () => {
      updateOsStore.setModalOpen(true);
    },
    icon: BellAlertIcon,
    text: availableWithRenewal.value
      ? props.t('Unraid OS {0} Released', [availableWithRenewal.value])
      : props.t('Unraid OS {0} Update Available', [available.value]),
  };
});
</script>

<template>
  <div class="grid gap-y-16px">
    <header class="grid gap-y-4px">
      <h1 v-if="title" class="text-24px font-semibold">
        {{ title }}
      </h1>
      <h2 v-if="subtitle" class="text-20px">
        {{ subtitle }}
      </h2>
    </header>
    <div class="flex flex-col md:flex-row gap-16px justify-start md:items-start md:justify-between">
      <div class="inline-flex flex-wrap justify-start gap-8px">
        <button
          class="group"
          :title="t('View release notes')"
          @click="updateOsActionsStore.viewReleaseNotes(t('{0} Release Notes', [osVersion]))"
        >
          <UiBadge :icon="InformationCircleIcon" class="underline">
            {{ t('Current Version {0}', [osVersion]) }}
          </UiBadge>
        </button>

        <a
          v-if="ineligibleText && !availableWithRenewal"
          :href="WEBGUI_TOOLS_REGISTRATION.toString()"
          class="group"
          :title="t('Learn more and fix')"
        >
          <UiBadge
            :color="'yellow'"
            :icon="ExclamationTriangleIcon"
            :title="regExpOutput?.text"
            class="underline"
          >
            {{ t('Key ineligible for future releases') }}
          </UiBadge>
        </a>
        <UiBadge
          v-else-if="ineligibleText && availableWithRenewal"
          :color="'yellow'"
          :icon="ExclamationTriangleIcon"
          :title="regExpOutput?.text"
        >
          {{ t('Key ineligible for {0}', [availableWithRenewal]) }}
        </UiBadge>

        <UiBadge
          v-if="status === 'checking'"
          :color="'orange'"
          :icon="BrandLoadingWhite"
        >
          {{ t('Checking...') }}
        </UiBadge>
        <template v-else>
          <UiBadge
            v-if="rebootType === ''"
            :color="updateAvailable ? 'orange' : 'green'"
            :icon="updateAvailable ? BellAlertIcon : CheckCircleIcon"
          >
            {{ (available
              ? t('Unraid {0} Available', [available])
              : (availableWithRenewal
                ? t('Up-to-date with eligible releases')
                : t('Up-to-date')))
            }}
          </UiBadge>
          <UiBadge
            v-else
            :color="'yellow'"
            :icon="ExclamationTriangleIcon"
          >
            {{ t(rebootTypeText) }}
          </UiBadge>
        </template>

        <UiBadge
          v-if="downgradeNotAvailable"
          :color="'gray'"
          :icon="XCircleIcon"
        >
          {{ t('No downgrade available') }}
        </UiBadge>
      </div>

      <div class="inline-flex flex-col flex-shrink-0 gap-16px flex-grow items-center">
        <span v-if="showRebootButton">
          <BrandButton
            btn-style="fill"
            :icon="ArrowPathIcon"
            :text="rebootType === 'downgrade' ? t('Reboot Now to Downgrade to {0}', [rebootVersion]) : t('Reboot Now to Update to {0}', [rebootVersion])"
            @click="updateOsActionsStore.rebootServer()"
          />
        </span>

        <span>
          <BrandButton
            :btn-style="checkButton.btnStyle"
            :icon="checkButton.icon"
            :text="checkButton.text"
            @click="checkButton.click"
          />
        </span>

        <span v-if="rebootType !== ''">
          <BrandButton
            btn-style="outline"
            :icon="XCircleIcon"
            :text="t('Cancel {0}', [rebootType === 'downgrade' ? t('Downgrade') : t('Update')])"
            @click="updateOsStore.cancelUpdate()"
          />
        </span>
      </div>
    </div>
  </div>
</template>
