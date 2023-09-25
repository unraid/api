<script lang="ts" setup>
import {
  ArrowTopRightOnSquareIcon,
  ArrowUturnDownIcon,
  InformationCircleIcon,
  LifebuoyIcon,
} from '@heroicons/vue/24/solid';
import type { SemVer } from 'semver';
import { ref } from 'vue';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import { FORUMS_BUG_REPORT } from '~/helpers/urls';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';
import type { UserProfileLink } from '~/types/userProfile';

const props = defineProps<{
  t: any;
  releaseDate: string;
  version: string;
}>();

const updateOsActionsStore = useUpdateOsActionsStore();

const visible = ref(false);
const toggleVisible = () => {
  visible.value = !visible.value;
};

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
    <div
      class="flex flex-col sm:flex-row sm:justify-between gap-20px sm:gap-24px"
      :class="{
        'sm:items-center': !visible,
        'sm:items-start': visible,
      }"
    >
      <div class="grid gap-y-16px">
        <h3 class="text-20px font-semibold leading-normal flex flex-row items-center gap-8px">
          <ArrowUturnDownIcon class="w-20px shrink-0" />
          {{ t('Downgrade Unraid OS to {0}', [version]) }}
        </h3>
        <div v-if="visible" class="text-16px leading-relaxed opacity-75 whitespace-normal">
          <p>{{ t('Downgrades are only recommended if you\'re unable to solve a critical issue. In the rare event you need to downgrade we ask that you please provide us with Diagnostics so we can investigate your issue. You will be prompted with the option to download the Diagnostics zip once the downgrade process is started. From there please open a bug report on our forums with a description of the issue and include your diagnostics.') }}</p>
        </div>
      </div>

      <BrandButton
        v-if="!visible"
        @click="toggleVisible"
        :btn-style="'outline'"
        :text="t('Learn More')" />

      <div v-else-if="downgradeButton" class="flex flex-col sm:flex-shrink-0 items-center gap-16px">
        <BrandButton
          :btn-style="'underline'"
          :external="true"
          :href="FORUMS_BUG_REPORT.toString()"
          :icon="LifebuoyIcon"
          :icon-right="ArrowTopRightOnSquareIcon"
          :text="t('Open a bug report')" />
        <p class="opacity-75">{{ t('Original release date {0}', [releaseDate]) }}</p>
        <BrandButton
          @click="downgradeButton?.click"
          btn-style="outline"
          :external="downgradeButton?.external"
          :icon="ArrowUturnDownIcon"
          :name="downgradeButton?.name"
          :text="downgradeButton?.text" />
      </div>
    </div>
  </UiCardWrapper>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
