<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import type { ComposerTranslation } from 'vue-i18n';

import useDateTimeHelper from '~/composables/dateTime';
import { useServerStore } from '~/store/server';

export interface Props {
  componentIs?: string;
  t: ComposerTranslation;
}

const props = withDefaults(defineProps<Props>(), {
  componentIs: 'p',
});

const serverStore = useServerStore();
const { dateTimeFormat, regExp, regUpdatesExpired } = storeToRefs(serverStore);

const { outputDateTimeReadableDiff, outputDateTimeFormatted } = useDateTimeHelper(
  dateTimeFormat.value,
  props.t,
  true,
  regExp.value
);

const output = computed(() => {
  if (!regExp.value) {
    return undefined;
  }
  return {
    text: regUpdatesExpired.value
      ? `${props.t('registration.updateExpirationAction.eligibleForUpdatesReleasedOnOr', [outputDateTimeFormatted.value])} ${props.t('registration.updateExpirationAction.extendYourLicenseToAccessThe')}`
      : props.t('registration.updateExpirationAction.eligibleForFreeFeatureUpdatesUntil', [
          outputDateTimeFormatted.value,
        ]),
    title: regUpdatesExpired.value
      ? props.t('registration.updateExpirationAction.ineligibleAsOf', [outputDateTimeReadableDiff.value])
      : props.t('registration.updateExpirationAction.eligibleForFreeFeatureUpdatesFor', [
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
