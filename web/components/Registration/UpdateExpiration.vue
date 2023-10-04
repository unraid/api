<script setup lang="ts">
import { storeToRefs } from 'pinia';

import useTimeHelper from '~/composables/time';
import { useServerStore } from '~/store/server';

export interface Props {
  componentIs?: string;
  t: any;
}

const props = withDefaults(defineProps<Props>(), {
  componentIs: 'p',
});

const serverStore = useServerStore();
const { dateTimeFormat, regExp, regUpdatesExpired } = storeToRefs(serverStore);

const { buildStringFromValues, dateDiff, formatDate } = useTimeHelper(dateTimeFormat.value, props.t);

const parsedTime = ref<string>('');
const formattedTime = computed<string>(() => formatDate(regExp.value));

const output = computed(() => {
  if (!regExp.value) {
    return undefined;
  }
  return {
    text: regUpdatesExpired.value
      ? props.t('Ineligible for updates released after {0}', [formattedTime.value])
      : props.t('Eligible for updates until {0}', [formattedTime.value]),
    title: regUpdatesExpired.value
      ? props.t('Ineligible as of {0}', [parsedTime.value])
      : props.t('Eligible for updates for {0}', [parsedTime.value]),
  };
});

const runDiff = () => {
  parsedTime.value = buildStringFromValues(dateDiff((regExp.value).toString(), false));
};

let interval: string | number | NodeJS.Timeout | undefined;
onBeforeMount(() => {
  runDiff();
  interval = setInterval(() => {
    runDiff();
  }, 1000);
});

onBeforeUnmount(() => {
  clearInterval(interval);
});
</script>

<template>
  <component
    v-if="output"
    :is="componentIs"
    :title="output.title"
  >
    <slot></slot>
    {{ output.text }}
  </component>
</template>
