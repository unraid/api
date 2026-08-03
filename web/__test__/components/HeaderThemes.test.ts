import { ref } from 'vue';
import { setActivePinia } from 'pinia';
import { provideApolloClient } from '@vue/apollo-composable';
import { mount } from '@vue/test-utils';

import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VueWrapper } from '@vue/test-utils';
import type { HeaderLogoStyle } from '~/themes/types';
import type { Server, ServerconnectPluginInstalled, ServerState } from '~/types/server';
import type { Pinia } from 'pinia';

import Header from '~/components/Header.standalone.vue';
import { useThemeStore } from '~/store/theme';

vi.mock('@vueuse/core', () => ({
  useClipboard: () => ({ copy: vi.fn(), copied: ref(false), isSupported: ref(true) }),
  useLocalStorage: <T>(_key: string, initialValue: T) => ref(initialValue),
}));

vi.mock('@unraid/ui', () => ({
  DropdownMenu: {
    template: '<div data-testid="dropdown-menu"><slot name="trigger" /><slot name="content" /></div>',
  },
  Button: { template: '<button><slot /></button>', props: ['variant', 'size'] },
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
  isDarkModeActive: vi.fn(() => false),
}));

vi.mock('~/store/callbackActions', () => ({
  useCallbackActionsStore: vi.fn(() => ({ watcher: vi.fn(), callbackData: ref(null) })),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const server: Server = {
  name: 'DEVGEN',
  description: 'Dev Server',
  guid: 'TEST-GUID',
  keyfile: 'keyfile.key',
  lanIp: '192.168.1.100',
  connectPluginInstalled: 'dynamix.unraid.net.plg' as ServerconnectPluginInstalled,
  state: 'PRO' as ServerState,
  dateTimeFormat: { date: 'YYYY-MM-DD', time: 'HH:mm' },
  deviceCount: 5,
  flashProduct: 'TestFlash',
  flashVendor: 'TestVendor',
  regGuid: 'REG-GUID',
  regTm: 1678886400,
  regTo: 'Test User',
  regTy: 'Pro',
  regExp: undefined,
  regUpdatesExpired: false,
  registered: true,
  wanIp: '8.8.8.8',
};

const stubs = {
  HeaderVersion: { template: '<div data-testid="header-version"></div>' },
  ArrayUsage: { template: '<div data-testid="array-usage"></div>' },
  UpcServerStatus: { template: '<div data-testid="server-status"></div>', props: ['class'] },
  NotificationsSidebar: { template: '<div data-testid="notifications-sidebar"></div>' },
  UpcDropdownContent: { template: '<div data-testid="dropdown-content"></div>' },
  UpcDropdownTrigger: { template: '<button data-testid="dropdown-trigger"></button>' },
};

/**
 * The four shipped webGUI themes. `white`/`black` are top-nav; `gray`/`azure` are
 * sidebar themes, which is where the boot placeholder previously mismatched the
 * mounted logo (the mounted logo compressed ~9% at mobile widths).
 */
const THEMES = [
  { name: 'white', sidebar: false },
  { name: 'black', sidebar: false },
  { name: 'gray', sidebar: true },
  { name: 'azure', sidebar: true },
] as const;

/**
 * A focused, stable signature of the layout decisions that must not regress —
 * far less brittle than snapshotting raw markup, and a diff points straight at
 * the offending class.
 */
const layoutSignature = (wrapper: VueWrapper) => {
  const root = wrapper.get('#UnraidHeader');
  const gradient = root.find('.unraid-banner-gradient-layer');
  const logoSvg = root.find('.uh-logo-block a svg');
  return {
    gradientLayer: gradient.exists() ? [...gradient.classes()].sort().join(' ') : null,
    logoSvg: logoSvg.exists() ? [...logoSvg.classes()].sort().join(' ') : null,
    regions: {
      logoBlock: root.find('.uh-logo-block').exists(),
      metaRight: root.find('.uh-meta-right').exists(),
      navRight: root.find('.uh-nav-right').exists(),
      version: root.find('.uh-version').exists(),
      // Sidebar themes are the only ones webGUI passes show-array-usage for, so
      // this differentiates the sidebar snapshots from the top-nav ones.
      arrayUsage: root.find('[data-testid="array-usage"]').exists(),
    },
    // Driven by the theme's `banner` flag, so this also proves the theme was
    // actually applied to the store rather than silently defaulting.
    metaOverBanner: root.find('.uh-meta-over-banner').exists(),
  };
};

describe('Header.standalone.vue theme layout', () => {
  let pinia: Pinia;
  const wrappers: VueWrapper[] = [];

  const mountWithTheme = (
    themeName: string,
    {
      logoStyle = '',
      showArrayUsage = false,
    }: { logoStyle?: HeaderLogoStyle | ''; showArrayUsage?: boolean } = {}
  ) => {
    const themeStore = useThemeStore();
    themeStore.setTheme({
      name: themeName,
      banner: true,
      bannerGradient: true,
      descriptionShow: true,
      textColor: '',
      metaColor: '',
      bgColor: '',
    });
    const wrapper = mount(Header, {
      props: {
        server: JSON.stringify(server),
        headerLogoStyle: logoStyle,
        // webGUI only passes this for sidebar themes with usage display enabled.
        ...(showArrayUsage ? { showArrayUsage: 'true' } : {}),
      },
      global: { plugins: [pinia], stubs },
    });
    wrappers.push(wrapper);
    return wrapper;
  };

  beforeEach(() => {
    provideApolloClient(new ApolloClient({ cache: new InMemoryCache() }));
    // stubActions: false so themeStore.setTheme() actually mutates the store.
    // With the default (stubbed) actions every case would silently run against
    // the default theme, making the per-theme coverage meaningless.
    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: { server: { ...server } },
      stubActions: false,
    });
    setActivePinia(pinia);
  });

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    vi.restoreAllMocks();
  });

  // Each theme is snapshotted in the configuration webGUI actually ships it in:
  // sidebar themes (gray/azure) carry the array-usage bar, top-nav themes do not.
  it.each(THEMES.map((theme) => [theme.name, theme] as const))(
    'renders a consistent layout on the %s theme',
    (_name, theme) => {
      const wrapper = mountWithTheme(theme.name, { showArrayUsage: theme.sidebar });
      expect(layoutSignature(wrapper)).toMatchSnapshot();
    }
  );

  it.each(THEMES.filter((theme) => theme.sidebar).map((theme) => [theme.name] as const))(
    'renders the array-usage bar on the %s sidebar theme',
    (name) => {
      expect(
        mountWithTheme(name, { showArrayUsage: true }).find('[data-testid="array-usage"]').exists()
      ).toBe(true);
    }
  );

  it.each(THEMES.filter((theme) => !theme.sidebar).map((theme) => [theme.name] as const))(
    'omits the array-usage bar on the %s top-nav theme',
    (name) => {
      expect(mountWithTheme(name).find('[data-testid="array-usage"]').exists()).toBe(false);
    }
  );

  it.each(['gradient', 'theme'] as const)('renders the %s header logo style', (logoStyle) => {
    expect(layoutSignature(mountWithTheme('white', { logoStyle })).logoSvg).toMatchSnapshot();
  });

  /**
   * Regression guard: the logo must keep a fixed width so the server-rendered
   * boot placeholder in webGUI `Header.php` (a static 14rem/16rem SVG) matches it
   * exactly through mount. `max-w-full` previously let the mounted logo compress
   * to ~127px on sidebar themes at mobile widths, so the placeholder visibly
   * resized on upgrade.
   */
  it.each(THEMES.map((theme) => [theme.name, theme] as const))(
    'keeps the logo a fixed size on the %s theme so the boot placeholder cannot resize on mount',
    (_name, theme) => {
      const logoSvg = mountWithTheme(theme.name).get('.uh-logo-block a svg');
      expect(logoSvg.classes()).toContain('shrink-0');
      expect(logoSvg.classes()).not.toContain('max-w-full');
      expect(logoSvg.classes()).toContain('w-[14rem]');
      expect(logoSvg.classes()).toContain('xs:w-[16rem]');
    }
  );

  /**
   * Regression guard: the banner gradient must stay within the legacy header's
   * `min(30%, 320px)` edge width. A bare `left-[55%]` covered the right 45%
   * (~576px at 1280px, ~1.8x legacy) and visibly obscured users' banner images.
   */
  it('scopes the banner gradient to the legacy edge width', () => {
    const gradient = mountWithTheme('white').get('.unraid-banner-gradient-layer');
    expect(gradient.classes()).toContain('w-[min(30%,320px)]');
    expect(gradient.classes()).toContain('right-0');
    expect(gradient.classes()).not.toContain('left-[55%]');
  });

  it('omits the banner gradient styling hook only when the theme disables it', () => {
    const themeStore = useThemeStore();
    themeStore.setTheme({
      name: 'white',
      banner: false,
      bannerGradient: false,
      descriptionShow: true,
      textColor: '',
      metaColor: '',
      bgColor: '',
    });
    const wrapper = mount(Header, {
      props: { server: JSON.stringify(server) },
      global: { plugins: [pinia], stubs },
    });
    wrappers.push(wrapper);
    // The layer is always present; `--banner-gradient` is null when disabled, so
    // it self-gates in CSS rather than by conditional rendering.
    expect(wrapper.find('.unraid-banner-gradient-layer').exists()).toBe(true);
    expect(wrapper.find('.uh-meta-over-banner').exists()).toBe(false);
  });
});
