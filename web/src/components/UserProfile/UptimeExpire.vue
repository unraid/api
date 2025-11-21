<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import useDateTimeHelper from '~/composables/dateTime';
import { useServerStore } from '~/store/server';

export interface Props {
  forExpire?: boolean;
  shortText?: boolean;
  as?: 'p' | 'span';
}

const props = withDefaults(defineProps<Props>(), {
  forExpire: false,
  shortText: false,
  as: 'p',
});

const { t } = useI18n();

const serverStore = useServerStore();
const { dateTimeFormat, uptime, expireTime, state } = storeToRefs(serverStore);

const style = computed(() => {
  if (props.as === 'span') {
    return {
      'text-align': 'right',
    };
  }
  return {};
});

const time = computed(() => {
  if (props.forExpire && expireTime.value) {
    return expireTime.value;
  }
  return (state.value === 'TRIAL' || state.value === 'EEXPIRED') &&
    expireTime.value &&
    expireTime.value > 0
    ? expireTime.value
    : uptime.value;
});

const countUp = computed<boolean>(() => {
  if (props.forExpire && expireTime.value) {
    return false;
  }
  return state.value !== 'TRIAL' && state.value !== 'ENOCONN';
});

const { outputDateTimeReadableDiff: readableDiff, outputDateTimeFormatted: formatted } =
  useDateTimeHelper(dateTimeFormat.value, t, false, time.value, countUp.value);

const output = computed(() => {
  if (!countUp.value || state.value === 'EEXPIRED') {
    return {
      title:
        state.value === 'EEXPIRED'
          ? props.shortText
            ? t('userProfile.uptimeExpire.expiredAt', [formatted.value])
            : t('userProfile.uptimeExpire.trialKeyExpiredAt', [formatted.value])
          : props.shortText
            ? t('userProfile.uptimeExpire.expiresAt', [formatted.value])
            : t('userProfile.uptimeExpire.trialKeyExpiresAt', [formatted.value]),
      text:
        state.value === 'EEXPIRED'
          ? props.shortText
            ? t('userProfile.uptimeExpire.expired', [readableDiff.value])
            : t('userProfile.uptimeExpire.trialKeyExpired', [readableDiff.value])
          : props.shortText
            ? t('userProfile.uptimeExpire.expiresIn', [readableDiff.value])
            : t('userProfile.uptimeExpire.trialKeyExpiresIn', [readableDiff.value]),
    };
  }
  return {
    title: t('userProfile.uptimeExpire.serverUpSince', [formatted.value]),
    text: t('userProfile.uptimeExpire.uptime', [readableDiff.value]),
  };
});
</script>

<template>
  <component :is="as" :title="output.title" :style="style">
    {{ output.text }}
  </component>
</template>
