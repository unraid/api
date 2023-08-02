<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import { request } from '~/composables/services/request';
import { useServerStore } from '~/store/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

export interface Props {
  phpWanIp?: string;
}

const props = defineProps<Props>();

const { t } = useI18n();

const { isRemoteAccess } = storeToRefs(useServerStore());

const wanIp = ref<string | null>();
const fetchError = ref<any>();
const loading = ref(false);

const computedError = computed(() => {
  if (!props.phpWanIp) { return t('DNS issue, unable to resolve wanip4.unraid.net'); }
  if (fetchError.value) { return fetchError.value; }
});

onBeforeMount(() => {
  wanIp.value = sessionStorage.getItem('unraidConnect_wanIp');
});

watchEffect(async () => {
  // if we don't have a client WAN IP AND we have the server WAN IP then we fetch
  if (!wanIp.value && props.phpWanIp) {
    console.debug('[watch] wanIp');
    loading.value = true;

    const response = await request.url('https://wanip4.unraid.net/')
      .get()
      .text();

    if (response) {
      console.debug('[watch] wanIp response', response);
      loading.value = false;
      wanIp.value = response as string; // response returns text nothing to traverse
      // save in sessionStorage so we only make this request once per webGUI session
      sessionStorage.setItem('unraidConnect_wanIp', wanIp.value);
    } else {
      loading.value = false;
      fetchError.value = t('Unable to fetch client WAN IPv4');
    }
  }
});
</script>

<template>
  <span v-if="loading" class="italic">{{ t('Checking WAN IPs…') }}</span>
  <template v-else>
    <span v-if="computedError" class="text-unraid-red font-semibold">{{ computedError }}</span>
    <template v-else>
      <span v-if="isRemoteAccess || phpWanIp === wanIp && !isRemoteAccess">{{ t('Remark: your WAN IPv4 is {0}', [wanIp]) }}</span>
      <span v-else class="inline-block w-1/2 whitespace-normal">
        {{ t("Remark: Unraid's WAN IPv4 {0} does not match your client's WAN IPv4 {1}.", [phpWanIp, wanIp]) }}
        {{ t('This may indicate a complex network that will not work with this Remote Access solution.') }}
        {{ t('Ignore this message if you are currently connected via Remote Access or VPN.') }}
      </span>
    </template>
  </template>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
