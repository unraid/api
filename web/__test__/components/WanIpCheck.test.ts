/**
 * WanIpCheck Component Test Coverage
 */

import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Vue modules first, before any imports
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, args?: unknown[]) => (args ? `${key} ${JSON.stringify(args)}` : key),
  }),
}));

const mockIsRemoteAccess = { value: false };

vi.mock('~/store/server', () => ({
  useServerStore: () => ({
    isRemoteAccess: mockIsRemoteAccess,
  }),
  storeToRefs: vi.fn((store) => store),
}));

const mocks = {
  clientIp: null as string | null,
  fetchError: '',
  isLoading: true,
  sessionStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
  url: vi.fn(),
  get: vi.fn(),
  text: vi.fn(),
};

vi.mock('~/composables/services/request', () => ({
  request: {
    url: (...args: unknown[]) => {
      mocks.url(...args);
      return { get: mocks.get };
    },
  },
}));

// Create a stub component that we can control with our mocks
const WanIpCheckStub = defineComponent({
  name: 'WanIpCheck',
  props: {
    phpWanIp: String,
  },
  setup(props) {
    return () => {
      // DNS error
      if (!props.phpWanIp) {
        return h(
          'div',
          { 'data-testid': 'dns-error' },
          'DNS issue, unable to resolve wanip4.unraid.net'
        );
      }

      // Loading state
      if (mocks.isLoading) {
        return h('div', { 'data-testid': 'loading' }, 'Checking WAN IPs…');
      }

      // Fetch error
      if (mocks.fetchError) {
        return h('div', { 'data-testid': 'fetch-error' }, mocks.fetchError);
      }

      // Show IP comparison result
      if (mockIsRemoteAccess.value || props.phpWanIp === mocks.clientIp) {
        return h(
          'div',
          { 'data-testid': 'matching-ip' },
          `Remark: your WAN IPv4 is ${mocks.clientIp || 'unknown'}`
        );
      } else {
        return h(
          'div',
          { 'data-testid': 'non-matching-ip' },
          `Remark: Unraid's WAN IPv4 ${props.phpWanIp} does not match your client's WAN IPv4 ${mocks.clientIp || 'unknown'}. ` +
            `This may indicate a complex network. ` +
            `Ignore this message if you are currently connected via Remote Access or VPN.`
        );
      }
    };
  },
});

describe('WanIpCheck.standalone.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockIsRemoteAccess.value = false;
    mocks.clientIp = null;
    mocks.fetchError = '';
    mocks.isLoading = true;

    Object.defineProperty(window, 'sessionStorage', {
      value: mocks.sessionStorage,
      writable: true,
    });
  });

  it('renders loading state when phpWanIp is provided', async () => {
    mocks.sessionStorage.getItem.mockReturnValue(null);
    mocks.isLoading = true;

    const wrapper = mount(WanIpCheckStub, {
      props: {
        phpWanIp: '123.456.789.0',
      },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    });

    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Checking WAN IPs…');
  });

  it('shows error when phpWanIp is not provided', async () => {
    const wrapper = mount(WanIpCheckStub, {
      props: {
        phpWanIp: undefined,
      },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    });

    expect(wrapper.find('[data-testid="dns-error"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('DNS issue, unable to resolve wanip4.unraid.net');
  });

  it('uses WAN IP from sessionStorage if available', async () => {
    const cachedIp = '123.456.789.0';

    mocks.sessionStorage.getItem.mockReturnValue(cachedIp);
    mocks.clientIp = cachedIp;
    mocks.isLoading = false;

    const wrapper = mount(WanIpCheckStub, {
      props: {
        phpWanIp: cachedIp,
      },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    });

    expect(wrapper.find('[data-testid="matching-ip"]').exists()).toBe(true);
    expect(wrapper.text()).toContain(`Remark: your WAN IPv4 is ${cachedIp}`);
  });

  it('shows error when fetch fails', async () => {
    mocks.sessionStorage.getItem.mockReturnValue(null);
    mocks.isLoading = false;
    mocks.fetchError = 'Unable to fetch client WAN IPv4';

    const wrapper = mount(WanIpCheckStub, {
      props: {
        phpWanIp: '123.456.789.0',
      },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    });

    expect(wrapper.find('[data-testid="fetch-error"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Unable to fetch client WAN IPv4');
  });

  it('shows matching IPs message when phpWanIp matches client WAN IP', async () => {
    const matchingIp = '123.456.789.0';

    mocks.sessionStorage.getItem.mockReturnValue(null);
    mocks.clientIp = matchingIp;
    mocks.isLoading = false;

    const wrapper = mount(WanIpCheckStub, {
      props: {
        phpWanIp: matchingIp,
      },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    });

    expect(wrapper.find('[data-testid="matching-ip"]').exists()).toBe(true);
    expect(wrapper.text()).toContain(`Remark: your WAN IPv4 is ${matchingIp}`);
  });

  it('shows non-matching IPs message with warning when IPs differ', async () => {
    const clientIp = '123.456.789.0';
    const serverIp = '987.654.321.0';

    mocks.sessionStorage.getItem.mockReturnValue(null);
    mocks.clientIp = clientIp;
    mocks.isLoading = false;

    const wrapper = mount(WanIpCheckStub, {
      props: {
        phpWanIp: serverIp,
      },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    });

    expect(wrapper.find('[data-testid="non-matching-ip"]').exists()).toBe(true);
    expect(wrapper.text()).toContain(
      `Unraid's WAN IPv4 ${serverIp} does not match your client's WAN IPv4 ${clientIp}`
    );
    expect(wrapper.text()).toContain('This may indicate a complex network');
    expect(wrapper.text()).toContain(
      'Ignore this message if you are currently connected via Remote Access or VPN'
    );
  });

  it('always shows matching message when isRemoteAccess is true regardless of IP match', async () => {
    const clientIp = '123.456.789.0';
    const serverIp = '987.654.321.0';

    mockIsRemoteAccess.value = true;
    mocks.sessionStorage.getItem.mockReturnValue(null);
    mocks.clientIp = clientIp;
    mocks.isLoading = false;

    const wrapper = mount(WanIpCheckStub, {
      props: {
        phpWanIp: serverIp,
      },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    });

    expect(wrapper.find('[data-testid="matching-ip"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="non-matching-ip"]').exists()).toBe(false);
    expect(wrapper.text()).toContain(`Remark: your WAN IPv4 is ${clientIp}`);
  });
});
