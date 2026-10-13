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
 * Consolidated Unraid header (Unraid 7.4+).
 *
 * Owns the entire header in a single web component so the responsive layout can be
 * managed in one place: the Unraid logo, OS/API version dropdown and
 * reboot/update banner, the array-usage bar, the server name, server status,
 * notifications bell, and the user/account dropdown. On Unraid < 7.4 the legacy
 * multi-component header (`unraid-header-os-version` + `unraid-user-profile`) is
 * rendered instead.
 *
 * A single grid keeps stateful controls mounted once. On mobile the server name
 * sits beside the version, with update notices on a separate full-width row.
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
   * is the persisted default and maps to the gradient logo. Typed as the known
   * styles plus `''` rather than a bare `string` so the union keeps its literal
   * meaning (a bare `string` would erase it).
   */
  headerLogoStyle?: HeaderLogoStyle | '';
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
const theme = computed(() => themeStore.theme);
const logoStyle = computed<HeaderLogoStyle>(() =>
  props.headerLogoStyle === 'theme' ? 'theme' : 'gradient'
);
const hasBanner = computed(() => theme.value?.banner === true);

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
    class="unraid-header-shell text-foreground relative z-20 w-full max-w-full"
    :class="{ 'uh-banner-gradient-enabled': themeStore.bannerGradient }"
  >
    <!-- Start the desktop fade before the account column so it follows the
         content width. Mobile uses a backdrop across all header rows. -->
    <div
      class="unraid-banner-gradient-layer pointer-events-none absolute inset-y-0 z-0"
      aria-hidden="true"
    />

    <div
      class="uh-meta-right relative z-10 flex max-w-full min-w-0 flex-col items-end gap-y-1 text-end"
      :class="{ 'uh-meta-over-banner': hasBanner }"
    >
      <ArrayUsage v-if="showArrayUsage" class="uh-array-usage" />
      <!--
        Below sm the meta row becomes a full-width top strip so the uptime and
        registration state split to opposite ends (uptime left, state right)
        instead of stacking cramped on the right. At sm+ it collapses back to the
        right-aligned desktop cluster. The backdrop provides contrast while
        preserving the configured header text colors.
      -->
      <UpcServerStatus
        class="uh-server-status max-sm:!w-full max-sm:!flex-row max-sm:!flex-wrap max-sm:!items-center max-sm:!justify-between max-sm:!gap-x-2"
      />
    </div>

    <div class="uh-logo-block relative z-10 flex min-w-0 flex-col items-start justify-center gap-y-2">
      <HeaderLogo class="uh-logo" :logo-style="logoStyle" />
      <div class="uh-version flex min-w-0">
        <HeaderVersion />
      </div>
    </div>

    <div class="uh-nav-right relative z-10 flex min-w-0 flex-row items-center justify-end gap-x-1">
      <div
        class="uh-name text-header-text-primary relative flex min-w-0 flex-row items-center border-0 text-base"
      >
        <template v-if="description && theme?.descriptionShow">
          <span
            class="hidden truncate text-end text-base md:!inline-flex md:!items-center"
            v-html="description"
          />
          <span class="text-header-text-secondary hidden md:!inline-flex md:!items-center">&bull;</span>
        </template>
        <Button
          v-if="lanIp"
          variant="ghost"
          :title="t('userProfile.clickToCopyLanIp', [lanIp])"
          class="text-header-text-primary flex h-auto max-w-full min-w-0 items-center truncate p-0 text-base opacity-100 transition-opacity hover:opacity-75 focus:opacity-75"
          @click="copyLanIp()"
        >
          <span class="truncate">{{ name }}</span>
        </Button>
        <span v-else class="text-header-text-primary xs:text-base flex items-center truncate text-sm">
          {{ name }}
        </span>
      </div>

      <div class="uh-actions flex shrink-0 items-center gap-x-1">
        <NotificationsSidebar />

        <DropdownMenu v-model:open="dropdownOpen" align="end" side="bottom" :side-offset="4">
          <template #trigger>
            <UpcDropdownTrigger compact />
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

<style scoped>
.unraid-header-shell {
  --uh-header-inset: calc(var(--spacing) * 2.5);
  display: grid;
  padding: calc(var(--spacing) * 1.25) var(--uh-header-inset);
  column-gap: 0.75rem;
  align-items: stretch;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto minmax(max-content, 1fr) auto;
}

.unraid-banner-gradient-layer {
  --uh-banner-color: var(--header-gradient-end, var(--color-header-gradient-end));
  --uh-banner-fade-width: clamp(14rem, 20vw, 32rem);
  grid-column: 2 / -1;
  inset-inline-start: calc(var(--uh-banner-fade-width) * -1);
  inset-inline-end: calc(var(--uh-header-inset) * -1);
  background-image: none;
}

.uh-banner-gradient-enabled .unraid-banner-gradient-layer {
  background-image: linear-gradient(
    90deg,
    transparent 0,
    color-mix(in srgb, var(--uh-banner-color) 3%, transparent) calc(var(--uh-banner-fade-width) * 0.1),
    color-mix(in srgb, var(--uh-banner-color) 10%, transparent) calc(var(--uh-banner-fade-width) * 0.2),
    color-mix(in srgb, var(--uh-banner-color) 22%, transparent) calc(var(--uh-banner-fade-width) * 0.3),
    color-mix(in srgb, var(--uh-banner-color) 35%, transparent) calc(var(--uh-banner-fade-width) * 0.4),
    color-mix(in srgb, var(--uh-banner-color) 50%, transparent) calc(var(--uh-banner-fade-width) * 0.5),
    color-mix(in srgb, var(--uh-banner-color) 65%, transparent) calc(var(--uh-banner-fade-width) * 0.6),
    color-mix(in srgb, var(--uh-banner-color) 78%, transparent) calc(var(--uh-banner-fade-width) * 0.7),
    color-mix(in srgb, var(--uh-banner-color) 90%, transparent) calc(var(--uh-banner-fade-width) * 0.8),
    color-mix(in srgb, var(--uh-banner-color) 97%, transparent) calc(var(--uh-banner-fade-width) * 0.9),
    var(--uh-banner-color) var(--uh-banner-fade-width)
  );
}

.uh-meta-right {
  grid-column: 2;
  grid-row: 1;
  align-self: start;
  justify-self: end;
  padding-right: 0.5rem;
}

.uh-logo-block {
  grid-column: 1;
  grid-row: 1 / -1;
  align-self: center;
  justify-self: start;
}

.uh-nav-right {
  grid-column: 2;
  grid-row: 2;
  align-self: center;
  justify-self: end;
}

.uh-version {
  position: relative;
  top: 0.5rem;
}

.uh-name {
  column-gap: calc(var(--spacing) * 2);
}

@media (max-width: 639.98px) {
  .unraid-header-shell {
    --uh-header-inset: calc(var(--spacing) * 2);
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto auto auto;
    column-gap: var(--spacing);
    row-gap: var(--spacing);
    padding-block: var(--spacing);
    padding-inline: var(--uh-header-inset) !important;
  }

  .uh-logo-block {
    display: contents;
  }

  .uh-nav-right {
    display: contents;
  }

  .uh-logo {
    position: relative;
    z-index: 10;
    grid-column: 1;
    grid-row: 2;
    align-self: center;
  }

  .uh-actions {
    position: relative;
    z-index: 10;
    grid-column: 2;
    grid-row: 2;
    justify-self: end;
    column-gap: 0;
  }

  .uh-actions :deep([role='button']) {
    min-height: 44px;
    min-width: 44px;
    padding: 0;
  }

  .uh-server-status :deep(.text-unraid-red),
  .uh-actions :deep(.text-unraid-red) {
    color: color-mix(in srgb, var(--color-unraid-red) 75%, var(--color-header-text-primary));
  }

  .uh-name {
    z-index: 10;
    grid-column: 2;
    grid-row: 3;
    align-self: center;
    justify-self: end;
    max-width: 100%;
    justify-content: flex-end;
  }

  .uh-version {
    display: contents;
  }

  .uh-version :deep(.header-version) {
    display: contents;
  }

  .uh-version :deep(.header-version-trigger) {
    position: relative;
    z-index: 10;
    grid-column: 1;
    grid-row: 3;
    align-self: center;
    justify-self: start;
  }

  .uh-version :deep(.header-update-status) {
    position: relative;
    z-index: 10;
    grid-column: 1 / -1;
    grid-row: 4;
  }

  .uh-meta-right {
    display: contents;
  }

  .uh-server-status,
  .uh-array-usage {
    position: relative;
    z-index: 10;
  }

  .uh-server-status {
    grid-column: 1 / -1;
    grid-row: 1;
  }

  .uh-array-usage {
    grid-column: 1 / -1;
    grid-row: auto;
  }

  .uh-meta-right,
  .uh-version {
    --color-header-text-secondary: var(--color-header-text-primary);
  }

  .unraid-banner-gradient-layer {
    grid-column: 1 / -1;
    inset-inline: calc(var(--uh-header-inset) * -1);
    width: auto;
    background-image: none;
  }

  .uh-banner-gradient-enabled .unraid-banner-gradient-layer {
    background-image:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--uh-banner-color) 95%, transparent) 0%,
        color-mix(in srgb, var(--uh-banner-color) 55%, transparent) 35%,
        var(--uh-banner-color) 100%
      ),
      linear-gradient(90deg, transparent 40%, var(--uh-banner-color) 80%);
  }
}
</style>
