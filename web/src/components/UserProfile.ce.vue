<script lang="ts" setup>
import { onBeforeMount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { Button, DropdownMenu } from '@unraid/ui';
import { devConfig } from '~/helpers/env';

import type { Server } from '~/types/server';

import NotificationsSidebar from '~/components/Notifications/Sidebar.vue';
import UpcDropdownContent from '~/components/UserProfile/DropdownContent.vue';
import UpcDropdownTrigger from '~/components/UserProfile/DropdownTrigger.vue';
import UpcServerStatus from '~/components/UserProfile/ServerStatus.vue';
import { useClipboardWithToast } from '~/composables/useClipboardWithToast';
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

// Control dropdown open state
const dropdownOpen = ref(false);

/**
 * Copy LAN IP on server name click
 */
const { copyWithNotification } = useClipboardWithToast();
const copyLanIp = async () => {
  if (lanIp.value) {
    await copyWithNotification(lanIp.value, t('LAN IP Copied'));
  }
};

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
  <div
    id="UserProfile"
    class="text-foreground absolute top-0 right-0 z-20 flex h-full flex-col gap-y-1 pt-2 pr-2"
  >
    <div
      v-if="bannerGradient"
      class="absolute top-0 right-0 bottom-0 z-0 w-full"
      :style="bannerGradient"
    />

    <UpcServerStatus class="relative z-10" />

    <div class="relative z-10 flex h-full flex-row items-center justify-end gap-x-2">
      <div
        class="text-header-text-primary relative flex flex-col-reverse items-center border-0 text-base md:flex-row md:items-center"
      >
        <template v-if="description && theme?.descriptionShow">
          <span
            class="hidden text-center text-base md:inline-flex md:items-center md:text-right"
            v-html="description"
          />
          <span class="text-header-text-secondary hidden px-2 md:inline-flex md:items-center"
            >&bull;</span
          >
        </template>
        <Button
          v-if="lanIp"
          variant="ghost"
          :title="t('Click to Copy LAN IP {0}', [lanIp])"
          class="text-header-text-primary flex h-auto items-center p-0 text-base opacity-100 transition-opacity hover:opacity-75 focus:opacity-75"
          @click="copyLanIp()"
        >
          {{ name }}
        </Button>
        <span v-else class="text-header-text-primary xs:text-base flex items-center text-sm">
          {{ name }}
        </span>
      </div>

      <NotificationsSidebar />

      <DropdownMenu v-model:open="dropdownOpen" align="end" side="bottom" :side-offset="4">
        <template #trigger>
          <UpcDropdownTrigger />
        </template>
        <template #content>
          <div class="max-w-[350px] sm:min-w-[350px]">
            <UpcDropdownContent @close-dropdown="dropdownOpen = false" />
          </div>
        </template>
      </DropdownMenu>
    </div>
  </div>
</template>
