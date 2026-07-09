<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { Button, DropdownMenu } from '@unraid/ui';

import type { Server } from '~/types/server';

import ArrayUsage from '~/components/Header/ArrayUsage.vue';
import HeaderVersion from '~/components/Header/HeaderVersion.vue';
import { useServerProp } from '~/components/Header/useServerProp';
import NotificationsSidebar from '~/components/Notifications/Sidebar.vue';
import UpcDropdownContent from '~/components/UserProfile/DropdownContent.vue';
import UpcDropdownTrigger from '~/components/UserProfile/DropdownTrigger.vue';
import UpcServerStatus from '~/components/UserProfile/ServerStatus.vue';
import { useClipboardWithToast } from '~/composables/useClipboardWithToast';
import { useServerStore } from '~/store/server';
import { useThemeStore } from '~/store/theme';

/**
 * Consolidated Unraid header (Unraid 7.3+).
 *
 * Owns the entire header in a single web component so the responsive layout can be
 * managed in one place: the Unraid logo, OS/API version dropdown and
 * reboot/update banner, the server name, server status, notifications bell, and the
 * user/account dropdown. On Unraid < 7.3 the legacy multi-component header
 * (`unraid-header-os-version` + `unraid-user-profile`) is rendered instead.
 */
export interface Props {
  server?: Server | string;
  /**
   * Render the array space-usage bar. Passed from webgui `Header.php` when the
   * active theme is a sidebar theme with usage display enabled, matching where the
   * legacy `#array-usage-sidenav` widget used to appear. Web-component attributes
   * arrive as strings, so accept both.
   */
  showArrayUsage?: boolean | string;
}
const props = defineProps<Props>();

const { t } = useI18n();

const serverStore = useServerStore();
const themeStore = useThemeStore();

useServerProp(() => props.server);

const showArrayUsage = computed(
  () => props.showArrayUsage === true || props.showArrayUsage === 'true' || props.showArrayUsage === ''
);

const name = computed(() => serverStore.name);
const description = computed(() => serverStore.description);
const lanIp = computed(() => serverStore.lanIp);
const bannerGradient = computed(() => themeStore.bannerGradient);
const theme = computed(() => themeStore.theme);

const dropdownOpen = ref(false);

const { copyWithNotification } = useClipboardWithToast();
const copyLanIp = async () => {
  if (lanIp.value) {
    await copyWithNotification(lanIp.value, t('userProfile.lanIpCopied'));
  }
};
</script>

<template>
  <div
    id="UnraidHeader"
    class="text-foreground relative z-20 flex w-full max-w-full flex-col gap-x-4 gap-y-3 p-2 sm:flex-row sm:items-start sm:justify-between"
  >
    <div
      v-if="bannerGradient"
      class="unraid-banner-gradient-layer pointer-events-none absolute inset-0 z-0"
    />

    <!-- Left cluster: logo, version dropdown, reboot/update banner -->
    <div class="relative z-10 flex max-w-full min-w-0 flex-col gap-y-2">
      <HeaderVersion />
    </div>

    <!-- Right cluster: array usage, server status, name, notifications bell, account menu -->
    <div class="relative z-10 flex max-w-full min-w-0 flex-col items-start gap-y-1 sm:items-end">
      <ArrayUsage v-if="showArrayUsage" />

      <UpcServerStatus />

      <div
        class="flex w-full flex-row flex-wrap items-center justify-start gap-x-2 gap-y-1 sm:w-auto sm:justify-end"
      >
        <div class="text-header-text-primary flex min-w-0 flex-row items-center border-0 text-base">
          <template v-if="description && theme?.descriptionShow">
            <span
              class="hidden truncate text-right text-base md:!inline-flex md:!items-center"
              v-html="description"
            />
            <span class="text-header-text-secondary hidden px-2 md:!inline-flex md:!items-center"
              >&bull;</span
            >
          </template>
          <Button
            v-if="lanIp"
            variant="ghost"
            :title="t('userProfile.clickToCopyLanIp', [lanIp])"
            class="text-header-text-primary flex h-auto min-w-0 items-center truncate p-0 text-base opacity-100 transition-opacity hover:opacity-75 focus:opacity-75"
            @click="copyLanIp()"
          >
            {{ name }}
          </Button>
          <span v-else class="text-header-text-primary xs:text-base flex items-center truncate text-sm">
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
  </div>
</template>
