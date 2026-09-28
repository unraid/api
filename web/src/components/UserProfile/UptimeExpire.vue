<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@unraid/ui';

import useDateTimeHelper from '~/composables/dateTime';
import { useServerStore } from '~/store/server';

// The tooltip wraps the display element, so forward attrs (class, etc.) onto it
// explicitly rather than letting Vue apply them to the tooltip provider root.
defineOptions({ inheritAttrs: false });

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

const {
  outputDateTimeReadableDiff: readableDiff,
  outputDateTimeReadableDiffShort: readableDiffShort,
  outputDateTimeFormatted: formatted,
} = useDateTimeHelper(dateTimeFormat.value, t, false, time.value, countUp.value);

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
  // In compact (shortText) placements like the header, show only the largest
  // uptime unit; the full breakdown + boot date move into the hover tooltip.
  return {
    title: t('userProfile.uptimeExpire.serverUpSince', [formatted.value]),
    text: t('userProfile.uptimeExpire.uptime', [
      props.shortText ? readableDiffShort.value : readableDiff.value,
    ]),
  };
});

// Only the compact uptime gets the richer hover tooltip; expire/full placements
// keep their plain native title.
const showUptimeTooltip = computed(() => props.shortText && countUp.value && state.value !== 'EEXPIRED');

const uptimeTooltipLines = computed<string[]>(() => [
  t('userProfile.uptimeExpire.uptime', [readableDiff.value]),
  t('userProfile.uptimeExpire.serverUpSince', [formatted.value]),
]);
</script>

<template>
  <TooltipProvider v-if="showUptimeTooltip" :delay-duration="200">
    <Tooltip>
      <TooltipTrigger as-child>
        <component :is="as" v-bind="$attrs" :style="style" class="cursor-default">
          {{ output.text }}
        </component>
      </TooltipTrigger>
      <TooltipContent>
        <p v-for="line in uptimeTooltipLines" :key="line" class="text-xs leading-snug">
          {{ line }}
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
  <component v-else :is="as" v-bind="$attrs" :title="output.title" :style="style">
    {{ output.text }}
  </component>
</template>
