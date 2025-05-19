<script lang="ts" setup>
import { h } from 'vue';
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
import { Badge, BrandButton, BrandLoading } from '@unraid/ui';
import { WEBGUI_TOOLS_REGISTRATION } from '~/helpers/urls';

import type { BrandButtonProps } from '@unraid/ui';

import useDateTimeHelper from '~/composables/dateTime';
import { useI18n } from '~/composables/useI18n';
import { useAccountStore } from '~/store/account';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

const { $gettext, $t } = useI18n();

export interface Props {
  downgradeNotAvailable?: boolean;
  restoreVersion?: string | undefined;
  showExternalDowngrade?: boolean;
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

const LoadingIcon = () => h(BrandLoading, { variant: 'white' });

const { dateTimeFormat, osVersion, rebootType, rebootVersion, regExp, regUpdatesExpired } =
  storeToRefs(serverStore);
const { available, availableWithRenewal } = storeToRefs(updateOsStore);
const { ineligibleText, rebootTypeText, status } = storeToRefs(updateOsActionsStore);

const updateAvailable = computed(() => available.value || availableWithRenewal.value);

const formatDateTimeFunc = (text: string) => $gettext(text);

const { outputDateTimeReadableDiff: readableDiffRegExp, outputDateTimeFormatted: formattedRegExp } =
  useDateTimeHelper(dateTimeFormat.value, formatDateTimeFunc, true, regExp.value);

const regExpOutput = computed(() => {
  if (!regExp.value) {
    return undefined;
  }
  return {
    text: regUpdatesExpired.value
      ? `${$t('Eligible for updates released on or before {0}.', [formattedRegExp.value])} ${$gettext('Extend your license to access the latest updates.')}`
      : $t('Eligible for free feature updates until {0}', [formattedRegExp.value]),
    title: regUpdatesExpired.value
      ? $t('Ineligible as of {0}', [readableDiffRegExp.value])
      : $t('Eligible for free feature updates for {0}', [readableDiffRegExp.value]),
  };
});

const showRebootButton = computed(
  () => rebootType.value === 'downgrade' || rebootType.value === 'update'
);

const checkButton = computed((): BrandButtonProps => {
  if (showRebootButton.value || props.showExternalDowngrade) {
    return {
      variant: 'outline',
      click: () => {
        if (props.showExternalDowngrade) {
          accountStore.downgradeOs();
        } else {
          accountStore.updateOs();
        }
      },
      icon: ArrowTopRightOnSquareIcon,
      text: $gettext('More options'),
    };
  }

  if (!updateAvailable.value) {
    return {
      variant: 'outline',
      click: () => {
        updateOsStore.localCheckForUpdate();
      },
      icon: ArrowPathIcon,
      text: $gettext('Check for Update'),
    };
  }

  return {
    variant: 'fill',
    click: () => {
      updateOsStore.setModalOpen(true);
    },
    icon: BellAlertIcon,
    text: availableWithRenewal.value
      ? $t('Unraid OS {0} Released', [availableWithRenewal.value ?? ''])
      : $t('Unraid OS {0} Update Available', [available.value ?? '']),
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
          :title="$gettext('View release notes')"
          @click="updateOsActionsStore.viewReleaseNotes($t('{0} Release Notes', [osVersion ?? '']))"
        >
          <Badge :icon="InformationCircleIcon" variant="gray" size="md">
            {{ $t('Current Version {0}', [osVersion ?? '']) }}
          </Badge>
        </button>

        <a
          v-if="ineligibleText && !availableWithRenewal"
          :href="WEBGUI_TOOLS_REGISTRATION.toString()"
          class="group"
          :title="$gettext('Learn more and fix')"
        >
          <Badge
            variant="yellow"
            :icon="ExclamationTriangleIcon"
            :title="regExpOutput?.text"
            class="underline"
          >
            {{ $gettext('Key ineligible for future releases') }}
          </Badge>
        </a>
        <Badge
          v-else-if="ineligibleText && availableWithRenewal"
          variant="yellow"
          :icon="ExclamationTriangleIcon"
          :title="regExpOutput?.text"
        >
          {{ $t('Key ineligible for {0}', [availableWithRenewal ?? '']) }}
        </Badge>

        <Badge v-if="status === 'checking'" variant="orange" :icon="LoadingIcon">
          {{ $gettext('Checking...') }}
        </Badge>
        <template v-else>
          <Badge
            v-if="rebootType === ''"
            :variant="updateAvailable ? 'orange' : 'green'"
            :icon="updateAvailable ? BellAlertIcon : CheckCircleIcon"
          >
            {{
              available
                ? $t('Unraid {0} Available', [available ?? ''])
                : availableWithRenewal
                  ? $gettext('Up-to-date with eligible releases')
                  : $gettext('Up-to-date')
            }}
          </Badge>
          <Badge v-else variant="yellow" :icon="ExclamationTriangleIcon">
            {{ $gettext(rebootTypeText) }}
          </Badge>
        </template>

        <Badge v-if="downgradeNotAvailable" variant="gray" :icon="XCircleIcon">
          {{ $gettext('No downgrade available') }}
        </Badge>
      </div>

      <div class="inline-flex flex-col flex-shrink-0 gap-16px flex-grow items-center md:items-end">
        <span v-if="showRebootButton">
          <BrandButton
            variant="fill"
            :icon="ArrowPathIcon"
            :text="
              rebootType === 'downgrade'
                ? $t('Reboot Now to Downgrade to {0}', [rebootVersion ?? ''])
                : $t('Reboot Now to Update to {0}', [rebootVersion ?? ''])
            "
            @click="updateOsActionsStore.rebootServer()"
          />
        </span>

        <span>
          <BrandButton
            :variant="checkButton.variant"
            :icon="checkButton.icon"
            :text="checkButton.text"
            @click="checkButton.click"
          />
        </span>

        <span v-if="rebootType !== ''">
          <BrandButton
            variant="outline"
            :icon="XCircleIcon"
            :text="$t('Cancel {0}', [rebootType === 'downgrade' ? $gettext('Downgrade') : $gettext('Update')])"
            @click="updateOsStore.cancelUpdate()"
          />
        </span>
      </div>
    </div>
  </div>
</template>
