<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { OnClickOutside } from '@vueuse/components'

import { useCallbackStore } from '~/store/callback';
import { useDropdownStore } from '~/store/dropdown';
import { useServerStore } from '~/store/server';
import type { Server } from '~/types/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

export interface Props {
  server?: Server;
}
const props = defineProps<Props>();

const callbackStore = useCallbackStore();
const dropdownStore = useDropdownStore()
const serverStore = useServerStore();

const { dropdownVisible } = storeToRefs(dropdownStore);
const { name, description, lanIp, theme } = storeToRefs(serverStore);

/**
 * Close dropdown when clicking outside
 * @note
 * If in testing you have two variants of the component on a page
 * the clickOutside will fire twice making it seem like it doesn't work
 */
const clickOutsideTarget = ref();
const clickOutsideIgnoreTarget = ref();
const outsideDropdown = () => {
  if (dropdownVisible.value) return dropdownStore.dropdownToggle();
};

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
  /**
   * Set props from web component in store so the data is available throughout other components
   */
  if (typeof props.server === 'object') { // Handles the testing dev Vue component
    serverStore.setServer(props.server);
  } else if (typeof props.server === 'string') { // Handle web component
    try {
      const parsedServerProp = JSON.parse(props.server);
      serverStore.setServer(parsedServerProp);
    } catch (e) {
      console.error(e);
    }
  }
  /**
   * Listen for callbacks, if we receive one that needs to be acted upon the store will display
   * the feedback modal to show the user something is happening behind the scenes.
   */
  callbackStore.watcher();
});
</script>

<template>
  <div id="UserProfile" class="text-alpha relative z-20 flex flex-col h-full gap-y-4px pt-4px pr-16px pl-40px">
    <div class="text-gamma text-12px text-right font-semibold leading-normal flex flex-row items-baseline justify-end gap-x-12px">
      <UpcUptimeExpire />
      <span>&bull;</span>
      <UpcServerState />
    </div>

    <div class="relative z-0 flex flex-row items-center justify-end gap-x-16px h-full">
      <h1 class="text-alpha relative text-18px border-t-0 border-r-0 border-l-0 border-b-2 border-transparent">
        <template v-if="description && theme?.descriptionShow">
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

      <OnClickOutside class="flex items-center justify-end h-full" @trigger="outsideDropdown" :options="{ ignore: [clickOutsideIgnoreTarget] }">
        <UpcDropdownTrigger ref="clickOutsideIgnoreTarget" />
        <UpcDropdown ref="clickOutsideTarget" />
      </OnClickOutside>
    </div>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
