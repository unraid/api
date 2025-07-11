<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import type { ComposerTranslation } from 'vue-i18n';

import useDateTimeHelper from '~/composables/dateTime';
import { useServerStore } from '~/store/server';

export interface Props {
  forExpire?: boolean;
  shortText?: boolean;
  as?: 'p' | 'span';
  t: ComposerTranslation;
}

const props = withDefaults(defineProps<Props>(), {
  forExpire: false,
  shortText: false,
  as: 'p',
});

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
} = useDateTimeHelper(dateTimeFormat.value, props.t, false, time.value, countUp.value);

const output = computed(() => {
  if (!countUp.value || state.value === 'EEXPIRED') {
    return {
      title: state.value === 'EEXPIRED'
        ? props.t(props.shortText ? 'Expired at {0}' : 'Trial Key Expired at {0}', [formatted.value])
        : props.t(props.shortText ? 'Expires at {0}' : 'Trial Key Expires at {0}', [formatted.value]),
      text: state.value === 'EEXPIRED'
        ? props.t(props.shortText ? 'Expired {0}' : 'Trial Key Expired {0}', [readableDiff.value])
        : props.t(props.shortText ? 'Expires in {0}' : 'Trial Key Expires in {0}', [readableDiff.value]),
    };
  }
  return {
    title: props.t('Server Up Since {0}', [formatted.value]),
    text: props.t('Uptime {0}', [readableDiff.value]),
  };
});
</script>

<template>
  <component :is="as" :title="output.title">
    {{ output.text }}
  </component>
</template>
