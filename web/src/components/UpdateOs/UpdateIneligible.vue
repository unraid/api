<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { ArrowTopRightOnSquareIcon, ExclamationTriangleIcon, EyeIcon } from '@heroicons/vue/24/solid';
import { BrandButton, CardWrapper } from '@unraid/ui';
import dayjs from 'dayjs';

import type { UserProfileLink } from '~/types/userProfile';

import RegistrationUpdateExpiration from '~/components/Registration/UpdateExpiration.vue';
import useDateTimeHelper from '~/composables/dateTime';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

const { t } = useI18n();

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { dateTimeFormat, renewAction, updateOsResponse } = storeToRefs(serverStore);
const { availableWithRenewal } = storeToRefs(updateOsStore);
const { ineligibleText } = storeToRefs(updateOsActionsStore);

const availableWithRenewalRelease = computed(() =>
  availableWithRenewal.value ? updateOsResponse.value : undefined
);
const { outputDateTimeFormatted: formattedReleaseDate } = useDateTimeHelper(
  dateTimeFormat.value,
  t,
  true,
  dayjs(availableWithRenewalRelease.value?.date, 'YYYY-MM-DD').valueOf()
);

const heading = computed((): string => {
  if (availableWithRenewal.value) {
    return t('headerOsVersion.unraidOsReleased', [availableWithRenewal.value]);
  }
  return t('updateOs.updateIneligible.licenseKeyUpdatesExpired');
});

const text = computed(() => {
  return ineligibleText.value;
});

const updateButton = ref<UserProfileLink | undefined>();

watchEffect(() => {
  if (availableWithRenewal.value) {
    updateButton.value = updateOsActionsStore.updateCallbackButton();
  } else {
    updateButton.value = updateOsActionsStore.updateCallbackButton();
  }
});
</script>

<template>
  <CardWrapper :increased-padding="true" :warning="true">
    <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div class="grid gap-y-4">
        <h3 class="flex flex-row items-start justify-start gap-2 leading-normal font-semibold">
          <ExclamationTriangleIcon class="w-5 shrink-0" />
          <span class="inline-flex flex-wrap items-baseline justify-start gap-2 leading-none">
            <span class="text-xl">
              {{ heading }}
            </span>
            <span
              v-if="
                availableWithRenewalRelease && availableWithRenewalRelease.date && formattedReleaseDate
              "
              class="shrink text-base opacity-75"
            >
              {{ formattedReleaseDate }}
            </span>
          </span>
        </h3>

        <h4 class="text-lg font-semibold italic">
          <RegistrationUpdateExpiration />
        </h4>

        <div class="prose text-base leading-relaxed whitespace-normal text-black" v-html="text" />
      </div>

      <div class="flex flex-col items-center gap-4 sm:shrink-0">
        <BrandButton
          :disabled="renewAction?.disabled"
          :external="renewAction?.external"
          :icon="renewAction.icon"
          :icon-right="ArrowTopRightOnSquareIcon"
          :text="t('updateOs.updateIneligible.extendLicense')"
          :title="t('updateOs.updateIneligible.payYourAnnualFeeToContinue')"
          class="grow"
          @click="renewAction.click?.()"
        />
        <!-- <BrandButton
          variant="black"
          href="/Tools/Registration"
          :icon="WrenchScrewdriverIcon"
          :icon-right="ArrowSmallRightIcon"
          :text="t('updateOs.updateIneligible.learnMoreAndFix')"
          class="flex-none" /> -->

        <BrandButton
          v-if="availableWithRenewal && updateButton"
          variant="outline-black"
          :external="updateButton?.external"
          :icon="EyeIcon"
          :icon-right="ArrowTopRightOnSquareIcon"
          :name="updateButton?.name"
          :text="t('updateOs.updateIneligible.viewChangelog')"
          class="flex-none"
          @click="updateButton?.click"
        />
      </div>
    </div>
  </CardWrapper>
</template>
