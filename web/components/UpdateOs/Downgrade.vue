<script lang="ts" setup>
import {
  ArrowTopRightOnSquareIcon,
  ArrowUturnDownIcon,
  LifebuoyIcon,
} from '@heroicons/vue/24/solid';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import useDateTimeHelper from '~/composables/dateTime';
import { FORUMS_BUG_REPORT } from '~/helpers/urls';
import { useServerStore } from '~/store/server';
import type { UserProfileLink } from '~/types/userProfile';

const props = defineProps<{
  t: any;
  releaseDate: string;
  version: string;
}>();

const serverStore = useServerStore();

const { dateTimeFormat } = storeToRefs(serverStore);
const {
  outputDateTimeFormatted: formattedReleaseDate,
} = useDateTimeHelper(dateTimeFormat.value, props.t, true, dayjs(props.releaseDate, 'YYYY-MM-DD').valueOf());

const downgradeButton = ref<UserProfileLink | undefined>({
  click: () => {
    // @ts-ignore – global function provided by the webgui on the update page
    downgrade();
  },
  name: 'downgrade',
  text: props.t('Begin restore to Unraid {0}', [props.version]),
});
</script>

<template>
  <UiCardWrapper :increased-padding="true">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-20px sm:gap-24px">
      <div class="grid gap-y-16px">
        <h3
          class="font-semibold leading-normal flex flex-row items-start justify-start gap-8px"
        >
          <ArrowUturnDownIcon class="w-20px shrink-0" />
          <span class="leading-none inline-flex flex-wrap justify-start items-baseline gap-8px">
            <span class="text-20px">
              {{ t('Downgrade Unraid OS to {0}', [version]) }}
            </span>
            <span
              v-if="releaseDate"
              class="text-16px opacity-75 shrink"
            >
              {{ t('Original release date {0}', [formattedReleaseDate]) }}
            </span>
          </span>
        </h3>
        <div class="text-16px leading-relaxed opacity-75 whitespace-normal">
          <p>{{ t('Downgrades are only recommended if you\'re unable to solve a critical issue. In the rare event you need to downgrade we ask that you please provide us with Diagnostics so we can investigate your issue. You will be prompted with the option to download the Diagnostics zip once the downgrade process is started. From there please open a bug report on our forums with a description of the issue and include your diagnostics.') }}</p>
        </div>
      </div>

      <div v-if="downgradeButton" class="flex flex-col sm:flex-shrink-0 items-center gap-16px">
        <BrandButton
          :btn-style="'underline'"
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
  </UiCardWrapper>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
