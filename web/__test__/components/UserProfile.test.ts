import { ref } from 'vue';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VueWrapper } from '@vue/test-utils';
import type { Server, ServerconnectPluginInstalled, ServerState } from '~/types/server';
import type { Pinia } from 'pinia';

import UserProfile from '~/components/UserProfile.ce.vue';
import { useServerStore } from '~/store/server';
import { useThemeStore } from '~/store/theme';

const mockCopy = vi.fn();
const mockCopied = ref(false);
const mockIsSupported = ref(true);

vi.mock('@vueuse/core', () => ({
  useClipboard: ({ _source }: { _source: MaybeRef<string> }) => {
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

// Test Data
const initialServerData: Server = {
  name: 'TestServer',
  description: 'Test Description',
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

// Component stubs for mount options
const stubs = {
  UpcUptimeExpire: { template: '<div data-testid="uptime-expire"></div>', props: ['t'] },
  UpcServerState: { template: '<div data-testid="server-state"></div>', props: ['t'] },
  NotificationsSidebar: { template: '<div data-testid="notifications-sidebar"></div>' },
  UpcDropdownMenu: {
    template: '<div data-testid="dropdown-menu"><slot name="trigger" /><slot /></div>',
    props: ['t'],
  },
  UpcDropdownTrigger: { template: '<button data-testid="dropdown-trigger"></button>', props: ['t'] },
};

describe('UserProfile.ce.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof UserProfile>>;
  let pinia: Pinia;
  let serverStore: ReturnType<typeof useServerStore>;
  let themeStore: ReturnType<typeof useThemeStore>;
  let consoleSpies: Array<ReturnType<typeof vi.spyOn>> = [];

  beforeEach(() => {
    // Suppress all console outputs
    consoleSpies = [
      vi.spyOn(console, 'log').mockImplementation(() => {}),
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
      vi.spyOn(console, 'debug').mockImplementation(() => {}),
      vi.spyOn(console, 'info').mockImplementation(() => {}),
      vi.spyOn(console, 'error').mockImplementation(() => {}),
    ];

    // Reset refs used by mocks
    mockCopied.value = false;
    mockIsSupported.value = true;

    // Define simple mock Event objects instead of classes with only constructors
    const MockEvent = vi.fn();
    const MockMouseEvent = vi.fn();

    // Set up window mocks
    vi.stubGlobal('window', {
      ...global.window,
      location: {
        ...global.window.location,
        protocol: 'https:',
      },
      document: {
        ...global.window.document,
        cookie: '',
      },
      Event: typeof global.window.Event === 'function' ? global.window.Event : MockEvent,
      MouseEvent:
        typeof global.window.MouseEvent === 'function' ? global.window.MouseEvent : MockMouseEvent,
    });

    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        server: { ...initialServerData },
        theme: {
          theme: {
            name: 'default',
            banner: true,
            bannerGradient: true,
            descriptionShow: true,
            textColor: '',
            metaColor: '',
            bgColor: '',
          },
          bannerGradient: 'linear-gradient(to right, #ff0000, #0000ff)',
        },
      },
      stubActions: false,
    });
    setActivePinia(pinia);

    serverStore = useServerStore();
    themeStore = useThemeStore();

    // Override the setServer method to prevent console logging
    vi.spyOn(serverStore, 'setServer').mockImplementation((server) => {
      Object.assign(serverStore, server);
      return server;
    });

    vi.clearAllMocks();

    // Mount the component
    wrapper = mount(UserProfile, {
      props: {
        server: JSON.stringify(initialServerData),
      },
      global: {
        plugins: [pinia],
        stubs,
      },
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    consoleSpies.forEach((spy) => spy.mockRestore());
    vi.restoreAllMocks();
    vi.unstubAllGlobals?.();
  });

  it('renders initial state correctly based on props and store', async () => {
    expect(serverStore.description).toBe(initialServerData.description);
    expect(themeStore.theme?.descriptionShow).toBe(true);

    await wrapper.vm.$nextTick();

    const heading = wrapper.find('h1');

    expect(heading.text()).toContain(initialServerData.name);
    expect(wrapper.find('[data-testid="uptime-expire"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="server-state"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="notifications-sidebar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dropdown-menu"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dropdown-trigger"]').exists()).toBe(true);
  });

  it('calls server store setServer and callback watcher on mount', () => {
    expect(serverStore.setServer).toHaveBeenCalledTimes(1);
    expect(serverStore.setServer).toHaveBeenCalledWith(JSON.parse(JSON.stringify(initialServerData)));
    expect(mockWatcher).toHaveBeenCalledTimes(1);
  });

  it('handles server prop as object', () => {
    const wrapperObjectProp = mount(UserProfile, {
      props: {
        server: initialServerData,
      },
      global: {
        plugins: [pinia],
        stubs,
      },
    });

    expect(serverStore.setServer).toHaveBeenCalledTimes(2);
    expect(serverStore.setServer).toHaveBeenLastCalledWith(initialServerData);
    expect(wrapperObjectProp.find('h1').text()).toContain(initialServerData.name);
    wrapperObjectProp.unmount();
  });

  it('handles server prop not being present', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      mount(UserProfile, {
        props: {},
        global: {
          plugins: [pinia],
          stubs,
        },
      })
    ).toThrow('Server data not present');

    consoleErrorSpy.mockRestore();
  });

  it('triggers clipboard copy when server name is clicked', async () => {
    const copyLanIpSpy = vi.spyOn(wrapper.vm as unknown as { copyLanIp: () => void }, 'copyLanIp');
    mockIsSupported.value = true;

    const serverNameButton = wrapper.find('h1 > button');

    await serverNameButton.trigger('click');
    await wrapper.vm.$nextTick();

    expect(copyLanIpSpy).toHaveBeenCalledTimes(1);
    expect(mockCopy).toHaveBeenCalledTimes(1);
    expect(mockCopy).toHaveBeenCalledWith(initialServerData.lanIp);

    const copiedMessage = wrapper.find('.text-white.text-12px');

    expect(copiedMessage.exists()).toBe(true);
    expect(copiedMessage.text()).toContain(t('LAN IP Copied'));

    copyLanIpSpy.mockRestore();
  });

  it('shows copy not supported message correctly', async () => {
    const copyLanIpSpy = vi.spyOn(wrapper.vm as unknown as { copyLanIp: () => void }, 'copyLanIp');
    mockIsSupported.value = false;

    const serverNameButton = wrapper.find('h1 > button');

    await serverNameButton.trigger('click');
    await wrapper.vm.$nextTick();

    expect(copyLanIpSpy).toHaveBeenCalledTimes(1);
    expect(mockCopy).not.toHaveBeenCalled();

    const notSupportedMessage = wrapper.find('.text-white.text-12px');

    expect(notSupportedMessage.exists()).toBe(true);
    expect(notSupportedMessage.text()).toContain(t('LAN IP {0}', [initialServerData.lanIp]));

    copyLanIpSpy.mockRestore();
  });

  it('conditionally renders description based on theme store', async () => {
    expect(serverStore.description).toBe(initialServerData.description);
    expect(themeStore.theme?.descriptionShow).toBe(true);

    serverStore.description = initialServerData.description!;
    themeStore.theme!.descriptionShow = true;
    await wrapper.vm.$nextTick();

    const heading = wrapper.find('h1');
    expect(heading.html()).toContain(initialServerData.description);

    themeStore.theme!.descriptionShow = false;
    await wrapper.vm.$nextTick();

    expect(heading.html()).not.toContain(initialServerData.description);

    themeStore.theme!.descriptionShow = true;
    await wrapper.vm.$nextTick();

    expect(heading.html()).toContain(initialServerData.description);
  });

  it('always renders notifications sidebar, regardless of connectPluginInstalled', async () => {
    expect(wrapper.find('[data-testid="notifications-sidebar"]').exists()).toBe(true);

    serverStore.connectPluginInstalled = '';
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="notifications-sidebar"]').exists()).toBe(true);
  });

  it('conditionally renders banner based on theme store', async () => {
    const bannerSelector = 'div.absolute.z-0';

    themeStore.theme = {
      ...themeStore.theme!,
      banner: true,
      bannerGradient: true,
    };
    await wrapper.vm.$nextTick();

    expect(themeStore.bannerGradient).toContain('background-image: linear-gradient');
    expect(wrapper.find(bannerSelector).exists()).toBe(true);

    themeStore.theme!.bannerGradient = false;
    await wrapper.vm.$nextTick();

    expect(themeStore.bannerGradient).toBeUndefined();
    expect(wrapper.find(bannerSelector).exists()).toBe(false);

    themeStore.theme!.bannerGradient = true;
    await wrapper.vm.$nextTick();

    expect(themeStore.bannerGradient).toContain('background-image: linear-gradient');
    expect(wrapper.find(bannerSelector).exists()).toBe(true);
  });
});
