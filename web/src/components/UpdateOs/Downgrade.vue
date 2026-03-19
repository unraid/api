<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import {
  ArrowTopRightOnSquareIcon,
  ArrowUturnDownIcon,
  FolderArrowDownIcon,
  InformationCircleIcon,
  LifebuoyIcon,
} from '@heroicons/vue/24/solid';
import { BrandButton, CardWrapper } from '@unraid/ui';
import { FORUMS_BUG_REPORT } from '~/helpers/urls';
import dayjs from 'dayjs';
import coerce from 'semver/functions/coerce';
import lt from 'semver/functions/lt';

import type { UserProfileLink } from '~/types/userProfile';

import useDateTimeHelper from '~/composables/dateTime';
import { useServerStore } from '~/store/server';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

const props = defineProps<{
  releaseDate: string;
  version: string;
}>();
const { t } = useI18n();

const serverStore = useServerStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { bootedFromFlashWithInternalBootSetup, dateTimeFormat, osVersion } = storeToRefs(serverStore);
const { outputDateTimeFormatted: formattedReleaseDate } = useDateTimeHelper(
  dateTimeFormat.value,
  t,
  true,
  dayjs(props.releaseDate, 'YYYY-MM-DD').valueOf()
);

const INTERNAL_BOOT_SUPPORT_VERSION = '7.3.0';

const isVersionIn73Series = (version: string | null | undefined) => {
  const normalizedVersion = coerce(version);
  if (!normalizedVersion) {
    return false;
  }
  return normalizedVersion.major === 7 && normalizedVersion.minor === 3;
};

const isBeforeInternalBootSupportVersion = (version: string | null | undefined) => {
  const normalizedVersion = coerce(version);
  if (!normalizedVersion) {
    return false;
  }
  return lt(normalizedVersion, INTERNAL_BOOT_SUPPORT_VERSION);
};

const shouldWarnAboutInternalBootDowngrade = computed(
  () =>
    bootedFromFlashWithInternalBootSetup.value &&
    isVersionIn73Series(osVersion.value) &&
    isBeforeInternalBootSupportVersion(props.version)
);

const startDowngrade = () => {
  if (shouldWarnAboutInternalBootDowngrade.value) {
    const confirmed = window.confirm(
      t('updateOs.downgrade.internalBootConfirmFrom73xToOlder', [osVersion.value, props.version])
    );
    if (!confirmed) {
      return;
    }
  }
  window.confirmDowngrade?.();
};

const diagnosticsButton = ref<UserProfileLink | undefined>({
  click: () => {
    window.downloadDiagnostics?.();
  },
  icon: FolderArrowDownIcon,
  name: 'download-diagnostics',
  text: t('updateOs.downgrade.downloadDiagnostics'),
});

const downgradeButton = ref<UserProfileLink>({
  click: startDowngrade,
  name: 'downgrade',
  text: t('updateOs.downgrade.beginDowngradeTo', [props.version]),
});
</script>

<template>
  <CardWrapper :increased-padding="true">
    <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div class="grid gap-y-4">
        <h3 class="flex flex-row items-start justify-start gap-2 leading-normal font-semibold">
          <ArrowUturnDownIcon class="w-5 shrink-0" />
          <span class="inline-flex flex-wrap items-baseline justify-start gap-2 leading-none">
            <span class="text-xl">
              {{ t('updateOs.downgrade.downgradeUnraidOsTo', [version]) }}
            </span>
            <span
              v-if="releaseDate && formattedReleaseDate !== 'Invalid Date'"
              class="shrink text-base opacity-75"
            >
              {{ t('updateOs.downgrade.originalReleaseDate', [formattedReleaseDate]) }}
            </span>
          </span>
        </h3>
        <div class="prose text-base leading-relaxed whitespace-normal opacity-75">
          <p>{{ t('updateOs.downgrade.downgradesAreOnlyRecommendedIfYou') }}</p>
          <p>
            {{ t('updateOs.downgrade.inTheRareEventYouNeed') }}
          </p>
          <p>
            {{ t('updateOs.downgrade.downloadTheDiagnosticsZipThenPlease') }}
          </p>
        </div>
        <div
          v-if="shouldWarnAboutInternalBootDowngrade"
          class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-900"
        >
          <p class="font-semibold">
            {{ t('updateOs.downgrade.internalBootWarningTitle') }}
          </p>
          <p>
            {{ t('updateOs.downgrade.internalBootWarningFrom73xToOlder', [osVersion, version]) }}
          </p>
        </div>
      </div>

      <div v-if="downgradeButton" class="flex shrink-0 grow flex-col items-stretch gap-4">
        <BrandButton
          :variant="'underline'"
          :icon="InformationCircleIcon"
          :text="t('updateOs.downgrade.releaseNotes', [version])"
          @click="
            updateOsActionsStore.viewReleaseNotes(
              t('updateOs.downgrade.releaseNotes', [version]),
              '/boot/previous/changes.txt'
            )
          "
        />
        <BrandButton
          v-if="diagnosticsButton"
          :variant="'gray'"
          :icon="diagnosticsButton.icon"
          :name="diagnosticsButton.name"
          :text="diagnosticsButton.text"
          @click="diagnosticsButton.click"
        />
        <BrandButton
          :variant="'gray'"
          :external="true"
          :href="FORUMS_BUG_REPORT.toString()"
          :icon="LifebuoyIcon"
          :icon-right="ArrowTopRightOnSquareIcon"
          :text="t('updateOs.downgrade.openABugReport')"
        />
        <BrandButton
          :external="downgradeButton?.external"
          :icon="ArrowUturnDownIcon"
          :name="downgradeButton?.name"
          :text="downgradeButton?.text"
          @click="downgradeButton?.click"
        />
      </div>
    </div>
  </CardWrapper>
</template>
