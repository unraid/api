<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';

import { ArrowTopRightOnSquareIcon, ExclamationTriangleIcon, EyeIcon } from '@heroicons/vue/24/solid';
import { BrandButton, CardWrapper } from '@unraid/ui';
import dayjs from 'dayjs';

import type { UserProfileLink } from '~/types/userProfile';
import type { ComposerTranslation } from 'vue-i18n';

import useDateTimeHelper from '~/composables/dateTime';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';
import RegistrationUpdateExpiration from '~/components/Registration/UpdateExpiration.vue';

const props = defineProps<{
  t: ComposerTranslation;
}>();

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { dateTimeFormat, regTy, renewAction, updateOsResponse } = storeToRefs(serverStore);
const { availableWithRenewal } = storeToRefs(updateOsStore);
const { ineligibleText } = storeToRefs(updateOsActionsStore);

const availableWithRenewalRelease = computed(() =>
  availableWithRenewal.value ? updateOsResponse.value : undefined
);
const { outputDateTimeFormatted: formattedReleaseDate } = useDateTimeHelper(
  dateTimeFormat.value,
  props.t,
  true,
  dayjs(availableWithRenewalRelease.value?.date, 'YYYY-MM-DD').valueOf()
);

const heading = computed((): string => {
  if (availableWithRenewal.value) {
    return props.t('Unraid OS {0} Released', [availableWithRenewal.value]);
  }
  return props.t('License Key Updates Expired');
});

const text = computed(() => {
  return props.t(ineligibleText.value, [regTy.value, formattedReleaseDate.value]);
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
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6">
      <div class="grid gap-y-4">
        <h3 class="font-semibold leading-normal flex flex-row items-start justify-start gap-2">
          <ExclamationTriangleIcon class="w-5 shrink-0" />
          <span class="leading-none inline-flex flex-wrap justify-start items-baseline gap-2">
            <span class="text-xl">
              {{ heading }}
            </span>
            <span
              v-if="
                availableWithRenewalRelease && availableWithRenewalRelease.date && formattedReleaseDate
              "
              class="text-base opacity-75 shrink"
            >
              {{ formattedReleaseDate }}
            </span>
          </span>
        </h3>

        <h4 class="text-lg font-semibold italic">
          <RegistrationUpdateExpiration :t="t" />
        </h4>

        <div class="prose text-black text-base leading-relaxed whitespace-normal" v-html="text" />
      </div>

      <div class="flex flex-col sm:shrink-0 items-center gap-4">
        <BrandButton
          :disabled="renewAction?.disabled"
          :external="renewAction?.external"
          :icon="renewAction.icon"
          :icon-right="ArrowTopRightOnSquareIcon"
          :text="t('Extend License')"
          :title="t('Pay your annual fee to continue receiving OS updates.')"
          class="grow"
          @click="renewAction.click?.()"
        />
        <!-- <BrandButton
          variant="black"
          href="/Tools/Registration"
          :icon="WrenchScrewdriverIcon"
          :icon-right="ArrowSmallRightIcon"
          :text="t('Learn more and fix')"
          class="flex-none" /> -->

        <BrandButton
          v-if="availableWithRenewal && updateButton"
          variant="outline-black"
          :external="updateButton?.external"
          :icon="EyeIcon"
          :icon-right="ArrowTopRightOnSquareIcon"
          :name="updateButton?.name"
          :text="t('View Changelog')"
          class="flex-none"
          @click="updateButton?.click"
        />
      </div>
    </div>
  </CardWrapper>
</template>
