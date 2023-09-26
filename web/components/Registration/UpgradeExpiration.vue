<script setup lang="ts">
import { storeToRefs } from 'pinia';

import useTimeHelper from '~/composables/time';
import { useServerStore } from '~/store/server';

export interface Props {
  t: any;
}

const props = defineProps<Props>();

const { buildStringFromValues, dateDiff, formatDate } = useTimeHelper(props.t);

const serverStore = useServerStore();
const { regTy, regUpdExpAt, regUpdExpired, state } = storeToRefs(serverStore);

const parsedTime = ref<string>('');
const formattedTime = computed<string>(() => formatDate(regUpdExpAt.value));

const output = computed(() => {
  if (!regUpdExpAt.value) {
    return undefined;
  }
  return {
    title: regUpdExpired.value
      ? props.t('Expired at {0}', [formattedTime.value])
      : props.t('Expires at {0}', [formattedTime.value]),
    text: regUpdExpired.value
      ? props.t('Expired {0}', [parsedTime.value])
      : props.t('Expires in {0}', [parsedTime.value]),
  };
});

const runDiff = () => {
  parsedTime.value = buildStringFromValues(dateDiff((regUpdExpAt.value).toString(), false));
};

let interval: string | number | NodeJS.Timeout | undefined;
onBeforeMount(() => {
  console.debug('[UpgradeExpiration.onBeforeMount]', props);
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
  <p
    v-if="output"
    :title="output.title"
  >
    {{ output.text }}
  </p>
</template>
