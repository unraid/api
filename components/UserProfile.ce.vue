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

const { name, description, guid } = storeToRefs(serverStore);

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
  <div class="text-white bg-blue-700 flex flex-col gap-y-2 p-4 rounded-lg">
    <h3 class="italic">{{ name }}</h3>
    <h4 class="text-gray-300">{{ description }}</h4>
    <h5>{{ guid }}</h5>
    <button class="p-2 text-blue-700 hover:text-white bg-white border border-white hover:bg-transparent rounded-sm" @click="callbackStore.send()" type="button">Test Purchase Callback</button>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
