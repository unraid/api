<script setup lang="ts">
import { storeToRefs } from 'pinia';

import useTimeHelper from '~/composables/time';
import { useServerStore } from '~/store/server';

export interface Props {
  forExpire?: boolean;
  t: any;
}

const props = withDefaults(defineProps<Props>(), {
  forExpire: false,
});

const { buildStringFromValues, dateDiff, formatDate } = useTimeHelper(props.t);

const serverStore = useServerStore();
const { uptime, expireTime, state } = storeToRefs(serverStore);

const time = computed(() => {
  if (props.forExpire && expireTime.value) {
    return expireTime.value;
  }
  return (state.value === 'TRIAL' || state.value === 'EEXPIRED') && expireTime.value && expireTime.value > 0
    ? expireTime.value
    : uptime.value;
});

const parsedTime = ref<string>('');
const formattedTime = computed<string>(() => formatDate(time.value));

const countUp = computed<boolean>(() => {
  if (props.forExpire && expireTime.value) {
    return false;
  }
  return state.value !== 'TRIAL' && state.value !== 'ENOCONN';
});

const output = computed(() => {
  if (!countUp.value || state.value === 'EEXPIRED') {
    return {
      title: state.value === 'EEXPIRED'
        ? props.t('Trial Key Expired at {0}', [formattedTime.value])
        : props.t('Trial Key Expires at {0}', [formattedTime.value]),
      text: state.value === 'EEXPIRED'
        ? props.t('Trial Key Expired {0}', [parsedTime.value])
        : props.t('Trial Key Expires in {0}', [parsedTime.value]),
    };
  }
  return {
    title: props.t('Server Up Since {0}', [formattedTime.value]),
    text: props.t('Uptime {0}', [parsedTime.value]),
  };
});

const runDiff = () => {
  parsedTime.value = buildStringFromValues(dateDiff((time.value).toString(), countUp.value));
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
  <p :title="output.title">
    {{ output.text }}
  </p>
</template>
