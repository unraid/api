<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useCallbackStore } from '~/store/callback';
import { useServerStore } from '~/store/server';
import type { Server } from '~/types/server';
import 'tailwindcss/tailwind.css';

export interface Props {
  server?: Server;
}

const props = defineProps<Props>();

const callbackStore = useCallbackStore();
const serverStore = useServerStore();

const { name, description, guid, uptime, expireTime, state } = storeToRefs(serverStore);

const uptimeOrExpiredTime = computed(() => {
  return (state.value === 'TRIAL' || state.value === 'EEXPIRED') && expireTime.value && expireTime.value > 0
    ? expireTime.value
    : uptime.value;
});

onBeforeMount(() => {
  console.debug('[onBeforeMount]', { props }, typeof props.server);
  if (!props.server) return console.error('Server data not present');
  // set props from web component in store so the data is available throughout other components
  if (typeof props.server === 'object') { // handle the testing dev Vue component
    serverStore.setServer(props.server);
  } else if (typeof props.server === 'string') { // handle web component
    try {
      const parsedServerProp = JSON.parse(props.server);
      serverStore.setServer(parsedServerProp);
    } catch (e) {
      console.error(e);
    }
  }
});
</script>

<template>
  <div>
    <div class="text-gamma text-12px text-right font-semibold leading-normal flex flex-row items-baseline justify-end pr-16px pt-4px">
      <UptimeExpire :time="uptimeOrExpiredTime" :state="state" />
      <span class="px-12px">&bull;</span>
      <ServerState />
    </div>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
