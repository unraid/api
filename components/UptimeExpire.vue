<script setup lang="ts">
import dateDiff from '~/helpers/time/dateDiff';
import dateFormat from '~/helpers/time/dateFormat';
import buildStringFromValues from '~/helpers/time/buildTimeString';

export interface Props {
  time: string;
  state: string;
}

const props = defineProps<Props>();

const parsedTime = ref<string>('');
const formattedTime = computed<string>(() => {
  return dateFormat(props.time);
});

const countUp = computed<boolean>(() => {
  return props.state !== 'TRIAL' && props.state === 'EEXPIRED';
})

const output = computed(() => {
  if (!countUp.value) {
    return {
      title: props.state === 'EEXPIRED'
        ? `Trial Key Expired at ${formattedTime.value}`
        : `Trial Key Expires at ${formattedTime.value}`,
      text: props.state === 'EEXPIRED'
        ? `Trial Key Expired ${parsedTime.value}`
        : `Trial Key Expires in ${parsedTime.value}`,
    };
  }
  return {
    title: `Server Up Since ${formattedTime.value}`,
    text: `Uptime ${parsedTime.value}`,
  };
});

const runDiff = () => parsedTime.value = buildStringFromValues(dateDiff(props.time, countUp.value));

let interval: string | number | NodeJS.Timeout | undefined = undefined;
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
  <p :title="output.title">{{ output.text }}</p>
</template>
