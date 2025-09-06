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
      ? `${props.t('Eligible for updates released on or before {0}.', [outputDateTimeFormatted.value])} ${props.t('Extend your license to access the latest updates.')}`
      : props.t('Eligible for free feature updates until {0}', [outputDateTimeFormatted.value]),
    title: regUpdatesExpired.value
      ? props.t('Ineligible as of {0}', [outputDateTimeReadableDiff.value])
      : props.t('Eligible for free feature updates for {0}', [outputDateTimeReadableDiff.value]),
  };
});
</script>

<template>
  <component :is="componentIs" v-if="output" :title="output.title">
    <slot />
    {{ output.text }}
  </component>
</template>
