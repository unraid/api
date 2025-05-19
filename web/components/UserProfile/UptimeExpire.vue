<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useI18n } from '~/composables/useI18n';

import useDateTimeHelper from '~/composables/dateTime';
import { useServerStore } from '~/store/server';

export interface Props {
  forExpire?: boolean;
  shortText?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  forExpire: false,
  shortText: false,
});

const { $t } = useI18n();

const serverStore = useServerStore();
const { dateTimeFormat, uptime, expireTime, state } = storeToRefs(serverStore);

const time = computed(() => {
  if (props.forExpire && expireTime.value) {
    return expireTime.value;
  }
  return (state.value === 'TRIAL' || state.value === 'EEXPIRED') && expireTime.value && expireTime.value > 0
    ? expireTime.value
    : uptime.value;
});

const countUp = computed<boolean>(() => {
  if (props.forExpire && expireTime.value) {
    return false;
  }
  return state.value !== 'TRIAL' && state.value !== 'ENOCONN';
});

const {
  outputDateTimeReadableDiff: readableDiff,
  outputDateTimeFormatted: formatted,
} = useDateTimeHelper(dateTimeFormat.value, false, time.value, countUp.value);

const output = computed(() => {
  if (!countUp.value || state.value === 'EEXPIRED') {
    return {
      title: state.value === 'EEXPIRED'
        ? $t(props.shortText ? 'Expired at {0}' : 'Trial Key Expired at {0}', [formatted.value])
        : $t(props.shortText ? 'Expires at {0}' : 'Trial Key Expires at {0}', [formatted.value]),
      text: state.value === 'EEXPIRED'
        ? $t(props.shortText ? 'Expired {0}' : 'Trial Key Expired {0}', [readableDiff.value])
        : $t(props.shortText ? 'Expires in {0}' : 'Trial Key Expires in {0}', [readableDiff.value]),
    };
  }
  return {
    title: $t('Server Up Since {0}', [formatted.value]),
    text: $t('Uptime {0}', [readableDiff.value]),
  };
});
</script>

<template>
  <p :title="output.title">
    {{ output.text }}
  </p>
</template>
