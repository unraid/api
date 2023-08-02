<script lang="ts" setup>
import { OnClickOutside } from '@vueuse/components';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import { useCallbackStore } from '~/store/callbackActions';
import { useDropdownStore } from '~/store/dropdown';
import { useServerStore } from '~/store/server';
import { useThemeStore } from '~/store/theme';
import type { Server } from '~/types/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const { t } = useI18n();

export interface Props {
  server?: Server | string;
}
const props = defineProps<Props>();

const callbackStore = useCallbackStore();
const dropdownStore = useDropdownStore();
const serverStore = useServerStore();

const { dropdownVisible } = storeToRefs(dropdownStore);
const { name, description, lanIp } = storeToRefs(serverStore);
const { bannerGradient, theme } = storeToRefs(useThemeStore());

/**
 * Close dropdown when clicking outside
 * @note
 * If in testing you have two variants of the component on a page
 * the clickOutside will fire twice making it seem like it doesn't work
 */
const clickOutsideTarget = ref();
const clickOutsideIgnoreTarget = ref();
const outsideDropdown = () => {
  if (dropdownVisible.value) { return dropdownStore.dropdownToggle(); }
};

/**
 * Copy LAN IP on server name click
 */
let copyIpInterval: string | number | NodeJS.Timeout | undefined;
const { copy, copied, isSupported } = useClipboard({ source: lanIp.value ?? '' });
const showCopyNotSupported = ref<boolean>(false);
const copyLanIp = () => {
  if (!isSupported) { showCopyNotSupported.value = true; }
  copy(lanIp.value ?? '');
};
watch(showCopyNotSupported, (newVal, oldVal) => {
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
  // console.debug('[onBeforeMount]', { props }, typeof props.server);
  if (!props.server) {
    throw new Error('Server data not present');
  }
  /**
   * Set props from web component in store so the data is available throughout other components
   */
  if (typeof props.server === 'object') { // Handles the testing dev Vue component
    serverStore.setServer(props.server);
  } else if (typeof props.server === 'string') { // Handle web component
    const parsedServerProp = JSON.parse(props.server);
    serverStore.setServer(parsedServerProp);
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
    <div v-if="bannerGradient" class="absolute z-0 w-[125%] top-0 bottom-0 right-0" :style="bannerGradient" />

    <div class="text-gamma text-10px xs:text-12px text-right font-semibold leading-normal relative z-10 flex flex-col items-end justify-end gap-x-4px xs:flex-row xs:items-baseline xs:gap-x-12px">
      <UpcUptimeExpire />
      <span class="hidden xs:block">&bull;</span>
      <UpcServerState :t="t" />
    </div>

    <div class="relative z-10 flex flex-row items-center justify-end gap-x-16px h-full">
      <h1 class="text-alpha text-14px sm:text-18px relative flex flex-col-reverse items-end md:flex-row border-0">
        <template v-if="description && theme?.descriptionShow">
          <span class="text-right text-12px sm:text-18px hidden 2xs:block">{{ description }}</span>
          <span class="text-gamma hidden md:inline-block px-8px">&bull;</span>
        </template>
        <button :title="t('Click to Copy LAN IP {0}', [lanIp])" @click="copyLanIp()">
          {{ name }}
        </button>
        <span
          v-show="copied || showCopyNotSupported"
          class="text-white text-12px leading-none py-4px px-8px absolute right-0 bg-gradient-to-r from-unraid-red to-orange text-center block rounded"
        >
          <template v-if="copied">{{ t('LAN IP Copied') }}</template>
          <template v-else>{{ t('LAN IP {0}', [lanIp]) }}</template>
        </span>
      </h1>

      <div class="block w-2px h-24px bg-gamma" />

      <OnClickOutside class="flex items-center justify-end h-full" :options="{ ignore: [clickOutsideIgnoreTarget] }" @trigger="outsideDropdown">
        <UpcDropdownTrigger ref="clickOutsideIgnoreTarget" :t="t" />
        <UpcDropdown ref="clickOutsideTarget" :t="t" />
      </OnClickOutside>
    </div>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;

.DropdownWrapper_blip {
  box-shadow: var(--ring-offset-shadow), var(--ring-shadow), var(--shadow-beta);

  &::before {
    @apply absolute z-20 block;

    content: '';
    width: 0;
    height: 0;
    top: -10px;
    right: 42px;
    border-right: 11px solid transparent;
    border-bottom: 11px solid var(--color-alpha);
    border-left: 11px solid transparent;
  }
}

.unraid_mark_2,
.unraid_mark_4 {
  animation: mark_2 1.5s ease infinite;
}
.unraid_mark_3 {
  animation: mark_3 1.5s ease infinite;
}
.unraid_mark_6,
.unraid_mark_8 {
  animation: mark_6 1.5s ease infinite;
}
.unraid_mark_7 {
  animation: mark_7 1.5s ease infinite;
}

@keyframes mark_2 {
  50% {
    transform: translateY(-40px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_3 {
  50% {
    transform: translateY(-62px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_6 {
  50% {
    transform: translateY(40px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_7 {
  50% {
    transform: translateY(62px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
