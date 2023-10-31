<script lang="ts" setup>
import {
  ArrowPathIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';

import { WEBGUI_TOOLS_REGISTRATION } from '~/helpers/urls';
import useDateTimeHelper from '~/composables/dateTime';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore, useUpdateOsActionsStore } from '~/store/updateOsActions';

import BrandLoadingWhite from '~/components/Brand/LoadingWhite.vue';

export interface Props {
  restoreVersion?: string | undefined;
  showUpdateCheck?: boolean;
  t: any;
  title?: string;
}
const props = withDefaults(defineProps<Props>(), {
  restoreVersion: undefined,
  showUpdateCheck: false,
  title: undefined,
});

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { dateTimeFormat, osVersion, regExp, regUpdatesExpired } = storeToRefs(serverStore);
const { available, availableWithRenewal, parsedReleaseTimestamp } = storeToRefs(updateOsStore);
const { ineligibleText, rebootType, rebootTypeText, status } = storeToRefs(updateOsActionsStore);

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
      ? props.t('Ineligible for updates released after {0}', [formattedRegExp.value])
      : props.t('Eligible for updates until {0}', [formattedRegExp.value]),
    title: regUpdatesExpired.value
      ? props.t('Ineligible as of {0}', [readableDiffRegExp.value])
      : props.t('Eligible for updates for {0}', [readableDiffRegExp.value]),
  };
});
</script>

<template>
  <div class="grid gap-y-16px">
    <h1 v-if="title" class="text-24px">
      {{ title }}
    </h1>
    <div class="flex flex-col md:flex-row gap-16px justify-start md:items-start md:justify-between">
      <div class="inline-flex flex-wrap justify-start gap-8px">
        <button
          class="group"
          :title="t('View release notes')"
          @click="updateOsActionsStore.viewCurrentReleaseNotes(t('{0} Release Notes', [osVersion]))"
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
            :color="available || availableWithRenewal ? 'orange' : 'green'"
            :icon="available || availableWithRenewal ? BellAlertIcon : CheckCircleIcon"
            :title="parsedReleaseTimestamp ? t('Last checked: {0}', [parsedReleaseTimestamp.relative]) : ''"
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
      </div>

      <div class="shrink-0">
        <UpdateOsCallbackButton
          v-if="showUpdateCheck && rebootType === ''"
          :t="t"
        />
        <BrandButton
          v-else-if="rebootType === 'downgrade' || rebootType === 'upgrade'"
          :icon="ArrowPathIcon"
          :text="rebootType === 'downgrade' ? t('Reboot Now to Downgrade') : t('Reboot Now to Update')"
          @click="updateOsActionsStore.rebootServer()"
        />
      </div>
    </div>
  </div>
</template>
