import { ref } from 'vue';
import { setActivePinia } from 'pinia';
import { provideApolloClient } from '@vue/apollo-composable';
import { mount } from '@vue/test-utils';

import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VueWrapper } from '@vue/test-utils';
import type { Server, ServerconnectPluginInstalled, ServerState } from '~/types/server';
import type { Pinia } from 'pinia';

import Header from '~/components/Header.standalone.vue';
import { useServerStore } from '~/store/server';
import { useThemeStore } from '~/store/theme';

const mockCopy = vi.fn();
const mockCopied = ref(false);
const mockIsSupported = ref(true);

vi.mock('@vueuse/core', () => ({
  useClipboard: () => {
    const actualCopy = (text: string) => {
      if (mockIsSupported.value) {
        mockCopy(text);
        mockCopied.value = true;
      } else {
        mockCopied.value = false;
      }
    };
    return {
      copy: actualCopy,
      copied: mockCopied,
      isSupported: mockIsSupported,
    };
  },
  useLocalStorage: <T>(key: string, initialValue: T) => {
    const storage = new Map<string, T>();
    if (!storage.has(key)) {
      storage.set(key, initialValue);
    }
    return ref(storage.get(key) ?? initialValue);
  },
}));

vi.mock('@unraid/ui', () => ({
  DropdownMenu: {
    template: '<div data-testid="dropdown-menu"><slot name="trigger" /><slot name="content" /></div>',
  },
  Button: {
    template: '<button><slot /></button>',
    props: ['variant', 'size'],
  },
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
  isDarkModeActive: vi.fn(() => false),
}));

const mockWatcher = vi.fn();

vi.mock('~/store/callbackActions', () => ({
  useCallbackActionsStore: vi.fn(() => ({
    watcher: mockWatcher,
    callbackData: ref(null),
  })),
}));

const t = (key: string, args?: unknown[]) => (args ? `${key} ${JSON.stringify(args)}` : key);
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t }),
}));

const initialServerData: Server = {
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

// Stub the heavier child components; the consolidated header is responsible for
// layout composition, which is what these tests exercise.
const stubs = {
  HeaderVersion: { template: '<div data-testid="header-version"></div>' },
  ArrayUsage: { template: '<div data-testid="array-usage"></div>' },
  UpcServerStatus: {
    template: '<div data-testid="server-status"></div>',
    props: ['class'],
  },
  NotificationsSidebar: { template: '<div data-testid="notifications-sidebar"></div>' },
  DropdownMenu: {
    template: '<div data-testid="dropdown-menu"><slot name="trigger" /><slot name="content" /></div>',
  },
  UpcDropdownContent: { template: '<div data-testid="dropdown-content"></div>' },
  UpcDropdownTrigger: { template: '<button data-testid="dropdown-trigger"></button>' },
};

describe('Header.standalone.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof Header>>;
  let pinia: Pinia;
  let serverStore: ReturnType<typeof useServerStore>;
  let themeStore: ReturnType<typeof useThemeStore>;
  let consoleSpies: Array<ReturnType<typeof vi.spyOn>> = [];

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'localhost',
        port: '3000',
        pathname: '/',
        protocol: 'http:',
        href: 'http://localhost:3000/',
      },
      writable: true,
      configurable: true,
    });

    provideApolloClient(new ApolloClient({ cache: new InMemoryCache() }));

    consoleSpies = [
      vi.spyOn(console, 'log').mockImplementation(() => {}),
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
      vi.spyOn(console, 'debug').mockImplementation(() => {}),
      vi.spyOn(console, 'error').mockImplementation(() => {}),
    ];

    mockCopied.value = false;
    mockIsSupported.value = true;

    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: { server: { ...initialServerData } },
      stubActions: false,
    });
    setActivePinia(pinia);

    serverStore = useServerStore();
    themeStore = useThemeStore();
    themeStore.setTheme({
      name: 'white',
      banner: true,
      bannerGradient: true,
      descriptionShow: true,
      textColor: '',
      metaColor: '',
      bgColor: '',
    });

    vi.spyOn(serverStore, 'setServer').mockImplementation((server) => {
      Object.assign(serverStore, server);
      return server;
    });

    vi.clearAllMocks();

    wrapper = mount(Header, {
      props: { server: JSON.stringify(initialServerData) },
      global: { plugins: [pinia], stubs },
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    consoleSpies.forEach((spy) => spy.mockRestore());
    vi.restoreAllMocks();
  });

  it('renders every header region in a single component', () => {
    expect(wrapper.find('[data-testid="header-version"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="server-status"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="notifications-sidebar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dropdown-menu"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dropdown-trigger"]').exists()).toBe(true);
    expect(wrapper.find('button').text()).toContain('DEVGEN');
  });

  it('hydrates the server store from the prop and starts the callback watcher', () => {
    expect(serverStore.setServer).toHaveBeenCalledTimes(1);
    expect(serverStore.setServer).toHaveBeenCalledWith(JSON.parse(JSON.stringify(initialServerData)));
    expect(mockWatcher).toHaveBeenCalledTimes(1);
  });

  it('throws when the server prop is missing', () => {
    expect(() => mount(Header, { props: {}, global: { plugins: [pinia], stubs } })).toThrow(
      'Server data not present'
    );
  });

  it('lays out on a responsive grid with each region in its own area (no overlap)', () => {
    const root = wrapper.get('#UnraidHeader');
    // A single grid owns the responsive layout (breakpoints live in scoped CSS).
    expect(root.classes()).toContain('unraid-header-shell');
    // Every header region is placed in its own grid area, so nothing is absolutely
    // positioned on top of anything else (the root cause of the old mobile overlap).
    expect(root.find('.uh-logo').exists()).toBe(true);
    expect(root.find('.uh-version').exists()).toBe(true);
    expect(root.find('.uh-meta-right').exists()).toBe(true);
    expect(root.find('.uh-nav-right').exists()).toBe(true);
    expect(root.find('.uh-name').exists()).toBe(true);
    // The only absolutely-positioned element allowed is the banner gradient layer.
    expect(root.classes()).not.toContain('absolute');
    expect(root.find('.absolute:not(.unraid-banner-gradient-layer)').exists()).toBe(false);
  });

  it('hides the array-usage bar by default and shows it when enabled', async () => {
    expect(wrapper.find('[data-testid="array-usage"]').exists()).toBe(false);

    const withUsage = mount(Header, {
      props: { server: JSON.stringify(initialServerData), showArrayUsage: 'true' },
      global: { plugins: [pinia], stubs },
    });
    expect(withUsage.find('[data-testid="array-usage"]').exists()).toBe(true);
    withUsage.unmount();
  });

  it('copies the LAN IP when the server name is clicked', async () => {
    mockIsSupported.value = true;
    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();
    expect(mockCopy).toHaveBeenCalledWith(initialServerData.lanIp);
  });
});
