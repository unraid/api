<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import useDateTimeHelper from '~/composables/dateTime';
import { useServerStore } from '~/store/server';

export interface Props {
  componentIs?: string;
}

const { componentIs = 'p' } = defineProps<Props>();

const { t } = useI18n();
const serverStore = useServerStore();
const { dateTimeFormat, regExp, regUpdatesExpired } = storeToRefs(serverStore);

const { outputDateTimeReadableDiff, outputDateTimeFormatted } = useDateTimeHelper(
  dateTimeFormat.value,
  t,
  true,
  regExp.value
);

const output = computed(() => {
  if (!regExp.value) {
    return undefined;
  }
  return {
    text: regUpdatesExpired.value
      ? `${t('registration.updateExpirationAction.eligibleForUpdatesReleasedOnOr', [outputDateTimeFormatted.value])} ${t('registration.updateExpirationAction.extendYourLicenseToAccessThe')}`
      : t('registration.updateExpirationAction.eligibleForFreeFeatureUpdatesUntil', [
          outputDateTimeFormatted.value,
        ]),
    title: regUpdatesExpired.value
      ? t('registration.updateExpirationAction.ineligibleAsOf', [outputDateTimeReadableDiff.value])
      : t('registration.updateExpirationAction.eligibleForFreeFeatureUpdatesFor', [
          outputDateTimeReadableDiff.value,
        ]),
  };
});
</script>

<template>
  <component :is="componentIs" v-if="output" :title="output.title">
    <slot />
    {{ output.text }}
  </component>
</template>
