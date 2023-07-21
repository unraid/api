<script setup lang="ts">
import { storeToRefs } from 'pinia';
import dateDiff from '~/helpers/time/dateDiff';
import dateFormat from '~/helpers/time/dateFormat';
import buildStringFromValues from '~/helpers/time/buildTimeString';
import { useServerStore } from '~/store/server';

export interface Props {
  forExpire?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  forExpire: false,
});

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
const formattedTime = computed<string>(() => {
  return dateFormat(time.value);
});

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
        ? `Trial Key Expired at ${formattedTime.value}`
        : `Trial Key Expires at ${formattedTime.value}`,
      text: state.value === 'EEXPIRED'
        ? `Trial Key Expired ${parsedTime.value}`
        : `Trial Key Expires in ${parsedTime.value}`,
    };
  }
  return {
    title: `Server Up Since ${formattedTime.value}`,
    text: `Uptime ${parsedTime.value}`,
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
