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
// On mobile the meta row spans full width over the banner image, so its text
// needs its own legibility treatment (drop-shadow) rather than the right-only
// banner gradient. Only when a banner image is present, otherwise the header is
// a solid color the theme text already reads against.
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
  <div id="UnraidHeader" class="unraid-header-shell text-foreground relative z-20 w-full max-w-full">
    <!--
      Banner-gradient backdrop. Darkens the right of the header so the metadata,
      server name, and account controls stay legible over a bright banner image,
      matching the legacy header. Rendered inside the component (in the `.unapi`
      scope) because the webgui `#header` element lives outside that scope, so the
      main.css `#header.image::before` edge gradient never matches here. The
      `.unraid-banner-gradient-layer` class (styled in main.css) paints
      `var(--banner-gradient)`, which is null when the banner gradient is
      disabled, so this self-gates. Sits behind the content columns (z-0).
      `left-[55%]` starts the darkening at the right ~45%, matching the legacy
      `#header.image::before` edge gradient in main.css (kept in sync by eye).
    -->
    <div
      class="unraid-banner-gradient-layer pointer-events-none absolute inset-y-0 right-0 left-[55%] z-0"
      aria-hidden="true"
    />

    <div
      class="uh-meta-right relative z-10 flex max-w-full min-w-0 flex-col items-end gap-y-1 text-end"
      :class="{ 'uh-meta-over-banner': hasBanner }"
    >
      <ArrayUsage v-if="showArrayUsage" />
      <!--
        Below sm the meta row becomes a full-width top strip so the uptime and
        registration state split to opposite ends (uptime left, state right)
        instead of stacking cramped on the right. At sm+ it collapses back to the
        right-aligned desktop cluster. Over a banner, force white text so both
        ends read against the image (paired with the drop-shadow in scoped CSS).
      -->
      <UpcServerStatus
        class="max-sm:!w-full max-sm:!flex-row max-sm:!items-center max-sm:!justify-between max-sm:!gap-x-2 max-sm:pr-2"
        :class="{ 'max-sm:!text-white': hasBanner }"
      />
    </div>

    <div class="uh-logo-block relative z-10 flex min-w-0 flex-col items-start justify-center gap-y-2">
      <HeaderLogo :logo-style="logoStyle" />
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
 * Three bands: metadata anchors top/bottom while the logo and UPC controls stay
 * centered in the primary middle band without overlapping the tags.
 */
/*
 * The `639.98px` media-query boundaries below are Tailwind's `sm` breakpoint
 * (640px) minus a hair, so these hand-written queries stay in lockstep with the
 * `sm:`/`max-sm:` utility classes used in the template above.
 */
.unraid-header-shell {
  display: grid;
  column-gap: 0.75rem;
  align-items: stretch;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto minmax(max-content, 1fr) auto;
}

.uh-meta-right {
  grid-column: 2;
  grid-row: 1;
  align-self: start;
  justify-self: end;
  /*
   * The account trigger below has 8px of internal right padding, so the meta
   * row needs the same inset for its right edge (uptime/registration/purchase)
   * to line up with the nav controls. Reset on mobile where the row goes
   * full-width (its inner content owns the padding there).
   */
  padding-right: 0.5rem;
}

/*
 * Mobile (below sm): the meta row spans the full width as a top strip so uptime
 * and registration state split to opposite ends. Over a banner image the text
 * gets a drop-shadow (and white color, set on the child) for legibility instead
 * of a heavy backdrop bar; the right-only banner gradient does not reach the
 * left-aligned uptime. At sm+ the desktop right-aligned cluster (above) applies
 * unchanged.
 */
@media (max-width: 639.98px) {
  .uh-meta-right {
    grid-column: 1 / -1;
    justify-self: stretch;
    padding-right: 0;
  }

  .uh-meta-over-banner {
    text-shadow:
      0 1px 2px rgb(0 0 0 / 0.95),
      0 0 4px rgb(0 0 0 / 0.8);
  }
}

/*
 * Logo + version as one vertically-centered group (matching the legacy header),
 * rather than the logo floating in the middle band with the version pinned to
 * the bottom, which left an awkward gap above the logo. On desktop the group
 * spans the full height so it centers against the whole header; the mobile
 * override below re-places it.
 */
.uh-logo-block {
  grid-column: 1;
  grid-row: 1 / -1;
  align-self: center;
  justify-self: start;
}

/*
 * Mobile: the host is stretched to the full header height (see main.css) and the
 * shell fills it, so the three grid rows span the whole header — the uptime sits
 * just below the top and the version mirrors it just above the bottom. The logo
 * stays centered in the middle row so it lines up with the account controls, and
 * the version is floated out of the block's flow to the bottom-left; keeping it
 * in flow would make the 2-line logo+version block impossible to center-align
 * against the taller 1-line control row. The block is `position: static` on
 * mobile so the floated version anchors to the shell (full height) rather than
 * the block; the logo sits left of the banner gradient, so dropping the block's
 * z-index here is safe.
 */
@media (max-width: 639.98px) {
  .unraid-header-shell {
    height: 100%;
    padding-top: 0.25rem;
  }

  .uh-logo-block {
    grid-row: 2;
    position: static;
  }

  .uh-logo-block > .uh-version {
    position: absolute;
    bottom: 0.25rem;
    left: 0;
  }
}

.uh-nav-right {
  grid-column: 2;
  grid-row: 2;
  align-self: center;
  justify-self: end;
}
</style>
