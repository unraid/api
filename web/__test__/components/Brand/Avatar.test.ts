import { mount } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Avatar from '~/components/Brand/Avatar.vue';
import BrandMark from '~/components/Brand/Mark.vue';
import { useServerStore } from '~/store/server';

vi.mock('crypto-js/aes.js', () => ({
  default: {},
}));

vi.mock('@unraid/shared-callbacks', () => ({
  useCallback: vi.fn(() => ({
    send: vi.fn(),
    watcher: vi.fn(),
  })),
}));

describe('Avatar', () => {
  let serverStore: ReturnType<typeof useServerStore>;
  let pinia: ReturnType<typeof createTestingPinia>;

  beforeEach(() => {
    vi.clearAllMocks();
    pinia = createTestingPinia({ createSpy: vi.fn });
    serverStore = useServerStore(pinia);
    serverStore.avatar = 'default-avatar.png';
    serverStore.connectPluginInstalled = 'dynamix.unraid.net.plg';
    serverStore.registered = true;
    serverStore.username = 'testuser';
  });

  it('renders BrandMark when avatar is an empty string', () => {
    serverStore.avatar = '';
    serverStore.connectPluginInstalled = 'dynamix.unraid.net.plg';
    serverStore.registered = true;

    const wrapper = mount(Avatar, {
      global: {
        plugins: [pinia],
        stubs: {
          BrandMark: true,
        },
      },
    });

    expect(wrapper.find('brand-mark-stub').exists()).toBe(true);
    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('renders BrandMark when connectPluginInstalled is an empty string (not installed)', () => {
    serverStore.avatar = 'user-avatar.png';
    serverStore.connectPluginInstalled = '';
    serverStore.registered = true;

    const wrapper = mount(Avatar, {
      global: {
        plugins: [pinia],
        stubs: {
          BrandMark: true,
        },
      },
    });

    expect(wrapper.find('brand-mark-stub').exists()).toBe(true);
    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('renders BrandMark when registered is false', () => {
    serverStore.avatar = 'user-avatar.png';
    serverStore.connectPluginInstalled = 'dynamix.unraid.net.plg';
    serverStore.registered = false;

    const wrapper = mount(Avatar, {
      global: {
        plugins: [pinia],
        stubs: {
          BrandMark: true,
        },
      },
    });

    expect(wrapper.find('brand-mark-stub').exists()).toBe(true);
    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('renders avatar image when all conditions are met', () => {
    serverStore.avatar = 'my-awesome-avatar.png';
    serverStore.connectPluginInstalled = 'dynamix.unraid.net.plg';
    serverStore.registered = true;
    serverStore.username = 'testUser';

    const wrapper = mount(Avatar, {
      global: {
        plugins: [pinia],
        stubs: {
          BrandMark: true,
        },
      },
    });

    const img = wrapper.find('img');

    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('my-awesome-avatar.png');
    expect(img.attributes('alt')).toBe('testUser');
    expect(wrapper.findComponent(BrandMark).exists()).toBe(false);
  });
});
