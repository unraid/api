<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { ArrowPathIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import { DOCS_REGISTRATION_LICENSING } from '~/helpers/urls';

import type { ComposerTranslation } from 'vue-i18n';

import RegistrationUpdateExpiration from '~/components/Registration/UpdateExpiration.vue';
import useDateTimeHelper from '~/composables/dateTime';
import { useReplaceRenewStore } from '~/store/replaceRenew';
import { useServerStore } from '~/store/server';

export interface Props {
  t: ComposerTranslation;
}

const props = defineProps<Props>();

const replaceRenewStore = useReplaceRenewStore();
const serverStore = useServerStore();

const { renewStatus } = storeToRefs(replaceRenewStore);
const { dateTimeFormat, regExp, regUpdatesExpired, renewAction } = storeToRefs(serverStore);

const reload = () => {
  window.location.reload();
};

const { outputDateTimeReadableDiff: readableDiffRegExp, outputDateTimeFormatted: formattedRegExp } =
  useDateTimeHelper(dateTimeFormat.value, props.t, true, regExp.value);

const output = computed(() => {
  if (!regExp.value) {
    return undefined;
  }
  return {
    text: regUpdatesExpired.value
      ? `${props.t('registration.updateExpirationAction.eligibleForUpdatesReleasedOnOr', [formattedRegExp.value])} ${props.t('registration.updateExpirationAction.extendYourLicenseToAccessThe')}`
      : props.t('registration.updateExpirationAction.eligibleForFreeFeatureUpdatesUntil', [
          formattedRegExp.value,
        ]),
    title: regUpdatesExpired.value
      ? props.t('registration.updateExpirationAction.ineligibleAsOf', [readableDiffRegExp.value])
      : props.t('registration.updateExpirationAction.eligibleForFreeFeatureUpdatesFor', [
          readableDiffRegExp.value,
        ]),
  };
});
</script>

<template>
  <div v-if="output" class="flex flex-col gap-2">
    <RegistrationUpdateExpiration :t="t" />

    <p class="text-sm opacity-90">
      <template v-if="renewStatus === 'installed'">
        {{ t('registration.updateExpirationAction.yourLicenseKeyWasAutomaticallyRenewed') }}
      </template>
    </p>
    <div class="flex flex-wrap items-start justify-between gap-2">
      <BrandButton
        v-if="renewStatus === 'installed'"
        :icon="ArrowPathIcon"
        :text="t('registration.updateExpirationAction.reloadPage')"
        class="grow"
        @click="reload"
      />
      <BrandButton
        v-else-if="regUpdatesExpired"
        :disabled="renewAction?.disabled"
        :external="renewAction?.external"
        :icon="renewAction.icon"
        :icon-right="ArrowTopRightOnSquareIcon"
        :icon-right-hover-display="true"
        :text="t('updateOs.updateIneligible.extendLicense')"
        :title="t('updateOs.updateIneligible.payYourAnnualFeeToContinue')"
        class="grow"
        @click="renewAction.click?.()"
      />

      <BrandButton
        variant="underline"
        :external="true"
        :href="DOCS_REGISTRATION_LICENSING.toString()"
        :icon-right="ArrowTopRightOnSquareIcon"
        :text="t('registration.keyLinkedStatus.learnMore')"
        class="text-sm"
      />
    </div>
  </div>
</template>
