<script lang="ts" setup>
import {
  ArrowTopRightOnSquareIcon,
  ArrowUturnDownIcon,
  FolderArrowDownIcon,
  InformationCircleIcon,
  LifebuoyIcon,
} from '@heroicons/vue/24/solid';
import { BrandButton, CardWrapper } from '@unraid/ui';
import useDateTimeHelper from '~/composables/dateTime';
import { FORUMS_BUG_REPORT } from '~/helpers/urls';
import { useServerStore } from '~/store/server';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';
import type { UserProfileLink } from '~/types/userProfile';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import type { ComposerTranslation } from 'vue-i18n';

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
    // @ts-expect-error – global function provided by the webgui on the update page
    downloadDiagnostics();
  },
  icon: FolderArrowDownIcon,
  name: 'download-diagnostics',
  text: props.t('Download Diagnostics'),
});

const downgradeButton = ref<UserProfileLink>({
  click: () => {
    // @ts-expect-error – global function provided by the webgui on the update page
    confirmDowngrade();
  },
  name: 'downgrade',
  text: props.t('Begin downgrade to {0}', [props.version]),
});
</script>

<template>
  <CardWrapper :increased-padding="true">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6">
      <div class="grid gap-y-4">
        <h3 class="font-semibold leading-normal flex flex-row items-start justify-start gap-2">
          <ArrowUturnDownIcon class="w-5 shrink-0" />
          <span class="leading-none inline-flex flex-wrap justify-start items-baseline gap-2">
            <span class="text-xl">
              {{ t('Downgrade Unraid OS to {0}', [version]) }}
            </span>
            <span
              v-if="releaseDate && formattedReleaseDate !== 'Invalid Date'"
              class="text-base opacity-75 shrink"
            >
              {{ t('Original release date {0}', [formattedReleaseDate]) }}
            </span>
          </span>
        </h3>
        <div class="prose text-base leading-relaxed opacity-75 whitespace-normal">
          <p>{{ t(`Downgrades are only recommended if you're unable to solve a critical issue.`) }}</p>
          <p>
            {{
              t(
                'In the rare event you need to downgrade we ask that you please provide us with Diagnostics so we can investigate your issue.'
              )
            }}
          </p>
          <p>
            {{
              t(
                'Download the Diagnostics zip then please open a bug report on our forums with a description of the issue along with your diagnostics.'
              )
            }}
          </p>
        </div>
      </div>

      <div v-if="downgradeButton" class="flex flex-col shrink-0 gap-4 grow items-stretch">
        <BrandButton
          :variant="'underline'"
          :icon="InformationCircleIcon"
          :text="t('{0} Release Notes', [version])"
          @click="
            updateOsActionsStore.viewReleaseNotes(
              t('{0} Release Notes', [version]),
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
          :text="t('Open a bug report')"
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

<style >
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '~/assets/main.css';
</style>
