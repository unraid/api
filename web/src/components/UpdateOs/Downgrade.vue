<script lang="ts" setup>
import { ref } from 'vue';
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

import type { UserProfileLink } from '~/types/userProfile';
import type { ComposerTranslation } from 'vue-i18n';

import useDateTimeHelper from '~/composables/dateTime';
import { useServerStore } from '~/store/server';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

const props = defineProps<{
  t: ComposerTranslation;
  releaseDate: string;
  version: string;
}>();

const serverStore = useServerStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { dateTimeFormat } = storeToRefs(serverStore);
const { outputDateTimeFormatted: formattedReleaseDate } = useDateTimeHelper(
  dateTimeFormat.value,
  props.t,
  true,
  dayjs(props.releaseDate, 'YYYY-MM-DD').valueOf()
);

const diagnosticsButton = ref<UserProfileLink | undefined>({
  click: () => {
    window.downloadDiagnostics?.();
  },
  icon: FolderArrowDownIcon,
  name: 'download-diagnostics',
  text: props.t('updateOs.downgrade.downloadDiagnostics'),
});

const downgradeButton = ref<UserProfileLink>({
  click: () => {
    window.confirmDowngrade?.();
  },
  name: 'downgrade',
  text: props.t('updateOs.downgrade.beginDowngradeTo', [props.version]),
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
