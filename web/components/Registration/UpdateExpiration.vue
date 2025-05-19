<script setup lang="ts">
import { storeToRefs } from 'pinia';

import useDateTimeHelper from '~/composables/dateTime';
import { useServerStore } from '~/store/server';
import { useI18n } from '~/composables/useI18n';

export interface Props {
  componentIs?: string;
}

const _props = withDefaults(defineProps<Props>(), {
  componentIs: 'p',
});

const { $gettext, $t } = useI18n();
const serverStore = useServerStore();
const { dateTimeFormat, regExp, regUpdatesExpired } = storeToRefs(serverStore);

const formatDateTimeFunc = (text: string) => $gettext(text);

const {
  outputDateTimeReadableDiff,
  outputDateTimeFormatted,
} = useDateTimeHelper(dateTimeFormat.value, formatDateTimeFunc, true, regExp.value);

const output = computed(() => {
  if (!regExp.value) {
    return undefined;
  }
  return {
    text: regUpdatesExpired.value
      ? `${$t('Eligible for updates released on or before {0}.', [outputDateTimeFormatted.value])} ${$gettext('Extend your license to access the latest updates.')}`
      : $t('Eligible for free feature updates until {0}', [outputDateTimeFormatted.value]),
    title: regUpdatesExpired.value
      ? $t('Ineligible as of {0}', [outputDateTimeReadableDiff.value])
      : $t('Eligible for free feature updates for {0}', [outputDateTimeReadableDiff.value]),
  };
});
</script>

<template>
  <component
    :is="componentIs"
    v-if="output"
    :title="output.title"
  >
    <slot />
    {{ output.text }}
  </component>
</template>
