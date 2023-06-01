<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useServerStore } from '~/store/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

export interface Props {
  phpWanIp?: string;
}

withDefaults(defineProps<Props>(), {
  phpWanIp: '0.0.0.0',
});

const serverStore = useServerStore();
const { isRemoteAccess } = storeToRefs(useServerStore());

const wanIp = ref<string | null>(sessionStorage.getItem('unraidConnect_wanIp'));

if (wanIp.value) {
  const error = ref<null>(null);
  // @fix [Vue warn]: Property "pending" was accessed during render but is not defined on instance. 
  const pending = ref<boolean>(false);
} else {
  const { data, pending, error, refresh } = await useFetch('https://wanip4.unraid.net/', {
    onRequestError({ request, options, error }) { // Handle the request errors
      console.debug('[onRequestError]', { request, options, error });
    },
    onResponse({ request, response, options }) { // Process the response data
      wanIp.value = response._data as string; // response returns text nothing to traverse
      // save in sessionStorage so we only make this request once per webGUI session
      sessionStorage.setItem('unraidConnect_wanIp', wanIp.value);
    },
    onResponseError({ request, response, options }) { // Handle the response errors
      console.debug('[onResponseError]', { request, response, options });
    }
  });
}

</script>

<template>
  <span v-if="pending">{{ `Checking WAN IPs…` }}</span>
  <template v-else>
    <span v-if="!phpWanIp" class="error">{{ error }}</span>
    <template v-else>
      <span v-if="isRemoteAccess">{{ `wanIpCheck.match ${wanIp}` }}</span>
      <span v-else-if="phpWanIp === wanIp && !isRemoteAccess">{{ `wanIpCheck.match ${wanIp}` }}</span>
      <span v-else class="mismatch">{{ `wanIpCheck.mismatch ${phpWanIp} !== ${wanIp}` }}</span>
    </template>
  </template>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
