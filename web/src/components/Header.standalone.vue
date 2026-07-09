<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { Button, DropdownMenu } from '@unraid/ui';

import type { HeaderLogoStyle } from '~/themes/types';
import type { Server } from '~/types/server';

import ArrayUsage from '~/components/Header/ArrayUsage.vue';
import HeaderLogo from '~/components/Header/HeaderLogo.vue';
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
 * reboot/update banner, the array-usage bar, the server name, server status,
 * notifications bell, and the user/account dropdown. On Unraid < 7.3 the legacy
 * multi-component header (`unraid-header-os-version` + `unraid-user-profile`) is
 * rendered instead.
 *
 * Layout is a CSS grid so a single `actions` block (bell + account menu) can be
 * repositioned across the breakpoint without duplicating stateful components:
 *   - mobile: app-style — logo + actions share the top row, then version, then
 *     status, then name.
 *   - sm+: two columns — logo/version on the left, status over name+actions on the
 *     right (the prior desktop look).
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
  /**
   * Header logo rendering style from WebGUI display settings. The empty string
   * is the persisted default and maps to the gradient logo.
   */
  headerLogoStyle?: HeaderLogoStyle | string;
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
const logoStyle = computed<HeaderLogoStyle>(() =>
  props.headerLogoStyle === 'theme' ? 'theme' : 'gradient'
);

const dropdownOpen = ref(false);

const { copyWithNotification } = useClipboardWithToast();
const copyLanIp = async () => {
  if (lanIp.value) {
    await copyWithNotification(lanIp.value, t('userProfile.lanIpCopied'));
  }
};
</script>

<template>
  <div id="UnraidHeader" class="unraid-header-shell text-foreground relative z-20 w-full max-w-full">
    <div
      v-if="bannerGradient"
      class="unraid-banner-gradient-layer pointer-events-none absolute inset-0 z-0"
    />

    <div
      class="uh-meta-right relative z-10 flex max-w-full min-w-0 flex-col items-end gap-y-1 text-right"
    >
      <ArrayUsage v-if="showArrayUsage" />
      <UpcServerStatus />
    </div>

    <div class="uh-logo relative z-10 flex min-w-0 items-center justify-start">
      <HeaderLogo :logo-style="logoStyle" />
    </div>

    <div class="uh-version relative z-10 flex max-w-full min-w-0 flex-col items-start justify-center">
      <HeaderVersion />
    </div>

    <div class="uh-nav-right relative z-10 flex min-w-0 flex-row items-center justify-end gap-x-1">
      <div
        class="uh-name text-header-text-primary relative flex min-w-0 flex-row items-center border-0 text-base"
      >
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
</template>

<style scoped>
/*
 * Compact mirror: version and status share the metadata row; logo and server
 * controls share the primary row.
 */
.unraid-header-shell {
  display: grid;
  column-gap: 0.75rem;
  row-gap: 0.25rem;
  align-items: stretch;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
}

.uh-meta-right {
  grid-column: 2;
  grid-row: 1;
  align-self: start;
  justify-self: end;
}

.uh-logo {
  grid-column: 1;
  grid-row: 2;
  align-self: center;
  justify-self: start;
}

.uh-version {
  grid-column: 1;
  grid-row: 1;
  align-self: start;
  justify-self: start;
}

.uh-nav-right {
  grid-column: 2;
  grid-row: 2;
  align-self: center;
  justify-self: end;
}
</style>
