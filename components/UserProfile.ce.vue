<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useClipboard, useToggle, onClickOutside } from '@vueuse/core';

import { useServerStore } from '~/store/server';
import type { Server } from '~/types/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

export interface Props {
  server?: Server;
  showDescription?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  showDescription: true,
});

/**
 * Dropdown handling
 */
const dropdown = ref(null);
const dropdownOpen = ref(false);
const toggleDropdown = useToggle(dropdownOpen);
onClickOutside(dropdown, (_event) => dropdownOpen.value = false);

const serverStore = useServerStore();
const { name, description, lanIp, uptime, expireTime, state } = storeToRefs(serverStore);

const uptimeOrExpiredTime = computed(() => {
  return (state.value === 'TRIAL' || state.value === 'EEXPIRED') && expireTime.value && expireTime.value > 0
    ? expireTime.value
    : uptime.value;
});

/**
 * Copy LAN IP on server name click
 */
let copyIpInterval: string | number | NodeJS.Timeout | undefined = undefined;
const { text, copy, copied, isSupported } = useClipboard({ source: lanIp.value ?? '' });
const showCopyNotSupported = ref<boolean>(false);
const copyLanIp = () => {
  if (!isSupported) showCopyNotSupported.value = true;
  copy(lanIp.value ?? '');
};
watch(showCopyNotSupported, async (newVal, oldVal) => {
  if (newVal && oldVal === false) {
    clearTimeout(copyIpInterval);
    copyIpInterval = setTimeout(() => {
      showCopyNotSupported.value = false;
    }, 2000);
  }
});

/**
 *
 */
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
  <div id="UserProfile" class="text-alpha relative z-20 flex flex-col h-full pl-80px rounded">
    <div class="text-gamma text-12px text-right font-semibold leading-normal flex flex-row items-baseline justify-end gap-x-12px">
      <UpcUptimeExpire :time="uptimeOrExpiredTime" :state="state" />
      <span>&bull;</span>
      <UpcServerState />
    </div>

    <div class="relative z-0 flex flex-row items-center justify-end gap-x-16px h-full">
      <h1 class="relative text-18px border-t-0 border-r-0 border-l-0 border-b-2 border-transparent">
        <template v-if="showDescription">
          <span>{{ description }}</span>
          <span class="text-grey-mid px-8px">&bull;</span>
        </template>
        <button @click="copyLanIp()" :title="`Click to Copy LAN IP ${lanIp}`">{{ name }}</button>
        <span
          v-show="copied || showCopyNotSupported"
          class="text-white text-12px leading-none py-4px px-8px absolute right-0 bg-gradient-to-r from-red to-orange text-center block rounded"
        >
          <template v-if="copied">{{ 'LAN IP Copied' }}</template>
          <template v-else>LAN IP: <span class="select-all">{{ lanIp }}</span></template>
        </span>
      </h1>

      <div class="block w-2px h-24px bg-grey-mid"></div>

      <div ref="dropdown" class="relative flex items-center justify-end h-full">
        <UpcDropdownTrigger @click="toggleDropdown" :open="dropdownOpen" />
        <UpcDropdown v-show="dropdownOpen" />
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
