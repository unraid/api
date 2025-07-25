<script lang="ts" setup>
import { onBeforeMount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useClipboard } from '@vueuse/core';

import { cn, DropdownMenu } from '@unraid/ui';
import { devConfig } from '~/helpers/env';

import type { Server } from '~/types/server';

import NotificationsSidebar from '~/components/Notifications/Sidebar.vue';
import UpcDropdownContent from '~/components/UserProfile/DropdownContent.vue';
import UpcDropdownTrigger from '~/components/UserProfile/DropdownTrigger.vue';
import UpcServerState from '~/components/UserProfile/ServerState.vue';
// Auto-imported components - now manually imported
import UpcUptimeExpire from '~/components/UserProfile/UptimeExpire.vue';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useServerStore } from '~/store/server';
import { useThemeStore } from '~/store/theme';

export interface Props {
  server?: Server | string;
}
const props = defineProps<Props>();

const { t } = useI18n();

const callbackStore = useCallbackActionsStore();
const serverStore = useServerStore();

const { callbackData } = storeToRefs(callbackStore);
const { name, description, guid, keyfile, lanIp } = storeToRefs(serverStore);
const { bannerGradient, theme } = storeToRefs(useThemeStore());

/**
 * Copy LAN IP on server name click
 */
let copyIpInterval: string | number | NodeJS.Timeout | undefined;
const { copy, copied, isSupported } = useClipboard({ source: lanIp.value ?? '' });
const showCopyNotSupported = ref<boolean>(false);
const copyLanIp = () => {
  // if http then clipboard is not supported
  if (!isSupported || window.location.protocol === 'http:') {
    showCopyNotSupported.value = true;
    return;
  }
  copy(lanIp.value ?? '');
};
watch(showCopyNotSupported, (newVal, oldVal) => {
  if (newVal && oldVal === false) {
    clearTimeout(copyIpInterval);
    copyIpInterval = setTimeout(() => {
      showCopyNotSupported.value = false;
    }, 5000);
  }
});

/**
 * Sets the server store and locale messages then listen for callbacks
 */
onBeforeMount(() => {
  if (!props.server) {
    throw new Error('Server data not present');
  }

  if (typeof props.server === 'object') {
    // Handles the testing dev Vue component
    serverStore.setServer(props.server);
  } else if (typeof props.server === 'string') {
    // Handle web component
    const parsedServerProp = JSON.parse(props.server);
    serverStore.setServer(parsedServerProp);
  }

  // look for any callback params
  callbackStore.watcher();

  if (guid.value && keyfile.value) {
    if (callbackData.value) {
      return console.debug(
        'Renew callback detected, skipping auto check for key replacement, renewal eligibility, and OS Update.'
      );
    }
  } else {
    console.warn(
      'A valid keyfile and USB Flash boot device are required to check for key renewals, key replacement eligibiliy, and OS update availability.'
    );
  }
});

onMounted(() => {
  if (devConfig.VITE_MOCK_USER_SESSION && devConfig.NODE_ENV === 'development') {
    document.cookie = 'unraid_session_cookie=mockusersession';
  }
});
</script>

<template>
  <div id="UserProfile" class="text-foreground relative z-20 flex flex-col h-full gap-y-1 pt-2 pr-2">
    <div
      v-if="bannerGradient"
      class="absolute z-0 w-full top-0 bottom-0 right-0"
      :style="bannerGradient"
    />

    <div
      :class="
        cn(
          'text-xs text-header-text-secondary text-right font-semibold leading-normal relative z-10 flex flex-wrap xs:flex-row items-baseline justify-end gap-x-1 xs:gap-x-4'
        )
      "
    >
      <UpcUptimeExpire :as="'span'" :t="t" class="text-xs" />
      <span class="hidden xs:block">&bull;</span>
      <UpcServerState :t="t" class="text-xs" />
    </div>

    <div class="relative z-10 flex flex-row items-center justify-end gap-x-4 h-full">
      <h1
        class="text-md sm:text-lg relative flex flex-col-reverse items-end md:flex-row border-0 text-header-text-primary"
      >
        <template v-if="description && theme?.descriptionShow">
          <span class="text-right text-xs sm:text-lg hidden md:inline-block" v-html="description" />
          <span class="text-header-text-secondary hidden md:inline-block px-2">&bull;</span>
        </template>
        <button
          v-if="lanIp"
          :title="t('Click to Copy LAN IP {0}', [lanIp])"
          class="text-header-text-primary opacity-100 hover:opacity-75 focus:opacity-75 transition-opacity"
          @click="copyLanIp()"
        >
          {{ name }}
        </button>
        <span v-else class="text-header-text-primary">
          {{ name }}
        </span>
        <span
          v-show="copied || showCopyNotSupported"
          class="text-white text-xs leading-none py-1 px-2 absolute top-full right-0 bg-linear-to-r from-unraid-red to-orange text-center block rounded"
        >
          <template v-if="copied">{{ t('LAN IP Copied') }}</template>
          <template v-else>{{ t('LAN IP {0}', [lanIp]) }}</template>
        </span>
      </h1>

      <div class="block w-[2px] h-6 bg-header-text-secondary" />

      <NotificationsSidebar />

      <DropdownMenu align="end" side="bottom" :side-offset="4">
        <template #trigger>
          <UpcDropdownTrigger :t="t" />
        </template>
        <template #content>
          <div class="max-w-[350px] sm:min-w-[350px]">
            <UpcDropdownContent :t="t" />
          </div>
        </template>
      </DropdownMenu>
    </div>
  </div>
</template>
