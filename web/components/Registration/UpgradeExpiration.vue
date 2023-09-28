<script setup lang="ts">
import { storeToRefs } from 'pinia';

import useTimeHelper from '~/composables/time';
import { useServerStore } from '~/store/server';

export interface Props {
  t: any;
}

const props = defineProps<Props>();


const serverStore = useServerStore();
const { dateTimeFormat, regTy, regExp, regUpdatesExpired, state } = storeToRefs(serverStore);

const { buildStringFromValues, dateDiff, formatDate } = useTimeHelper(dateTimeFormat.value, props.t);

const parsedTime = ref<string>('');
const formattedTime = computed<string>(() => formatDate(regExp.value));

const output = computed(() => {
  if (!regExp.value) {
    return undefined;
  }
  return {
    text: regUpdatesExpired.value
      ? props.t('Ineligible since {0}', [formattedTime.value])
      : props.t('Valid until {0}', [formattedTime.value]),
    title: regUpdatesExpired.value
      ? props.t('Ineligible as of {0}', [parsedTime.value])
      : props.t('Valid for {0}', [parsedTime.value]),
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
  <span v-if="output" class="flex flex-col gap-y-4px">
    <p
      :title="output.title"
    >
      {{ output.text }}
    </p>
    <p v-if="regUpdatesExpired" class="text-14px opacity-90">
      <em>{{ t('Renew your license key to continue receiving OS updates.') }}</em>
    </p>
  </span>
</template>
