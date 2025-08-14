/**
 * SsoButton Component Test Coverage
 */

import { useQuery } from '@vue/apollo-composable';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock, MockInstance } from 'vitest';

import SsoButtons from '~/components/sso/SsoButtons.vue';

// Mock the child components
const SsoProviderButtonStub = {
  template: '<button @click="handleClick" :disabled="disabled">{{ provider.buttonText || `Sign in with ${provider.name}` }}</button>',
  props: ['provider', 'disabled', 'onClick'],
  methods: {
    handleClick(this: { onClick: (id: string) => void; provider: { id: string } }) {
      this.onClick(this.provider.id);
    }
  }
};

// Mock the GraphQL composable
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

// Mock vue-i18n
const t = (key: string) => key;
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t }),
}));

// Mock the GraphQL query
vi.mock('~/components/queries/public-oidc-providers.query', () => ({
  PUBLIC_OIDC_PROVIDERS: 'PUBLIC_OIDC_PROVIDERS_QUERY',
}));

// Mock window APIs
vi.stubGlobal('fetch', vi.fn());
vi.stubGlobal('sessionStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});
const mockCrypto = {
  getRandomValues: vi.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
};
vi.stubGlobal('crypto', mockCrypto);
let mockLocationHref = 'http://mock-origin.com/login';
const mockLocation = {
  search: '',
  hash: '',
  origin: 'http://mock-origin.com',
  pathname: '/login',
  get href() {
    return mockLocationHref;
  },
  set href(value: string) {
    mockLocationHref = value;
  },
};
vi.stubGlobal('location', mockLocation);
vi.stubGlobal('URLSearchParams', URLSearchParams);
vi.stubGlobal('URL', URL);
const mockHistory = {
  replaceState: vi.fn(),
};
vi.stubGlobal('history', mockHistory);

// Mock DOM interactions
const mockForm = {
  requestSubmit: vi.fn(),
  style: { display: 'block' },
};
const mockPasswordField = { value: '' };
const mockUsernameField = { value: '' };

describe('SsoButtons', () => {
  let querySelectorSpy: MockInstance;
  let mockUseQuery: Mock;

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    mockUseQuery = useQuery as Mock;

    (sessionStorage.getItem as Mock).mockReturnValue(null);
    (sessionStorage.setItem as Mock).mockClear();
    (sessionStorage.removeItem as Mock).mockClear();
    mockForm.requestSubmit.mockClear();
    mockPasswordField.value = '';
    mockUsernameField.value = '';
    mockForm.style.display = 'block';
    mockLocation.search = '';
    mockLocation.hash = '';
    mockLocationHref = 'http://mock-origin.com/login';
    mockLocation.pathname = '/login';
    (fetch as Mock).mockClear();
    mockUseQuery.mockClear();

    // Spy on document.querySelector and provide mock implementation
    querySelectorSpy = vi.spyOn(document, 'querySelector');
    querySelectorSpy.mockImplementation((selector: string) => {
      if (selector === 'form[action="/login"]') return mockForm as unknown as HTMLFormElement;
      if (selector === 'input[name=password]') return mockPasswordField as unknown as HTMLInputElement;
      if (selector === 'input[name=username]') return mockUsernameField as unknown as HTMLInputElement;
      return null;
    });

    Object.defineProperty(document, 'title', {
      value: 'Mock Title',
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders provider buttons when OIDC providers are available', async () => {
    const mockProviders = [
      { 
        id: 'unraid-net', 
        name: 'Unraid.net',
        buttonText: 'Log In With Unraid.net',
        buttonIcon: null,
        buttonVariant: 'secondary',
        buttonStyle: null
      }
    ];
    
    mockUseQuery.mockReturnValue({
      result: { value: { publicOidcProviders: mockProviders } },
      refetch: vi.fn().mockResolvedValue({ data: { publicOidcProviders: mockProviders } }),
    });

    const wrapper = mount(SsoButtons, {
      global: {
        stubs: { 
          SsoProviderButton: SsoProviderButtonStub,
          Button: { template: '<button><slot /></button>' }
        },
      },
    });
    
    // Wait for the API check to complete
    await flushPromises();
    vi.runAllTimers();
    await flushPromises();
    
    expect(wrapper.text()).toContain('or');
    expect(wrapper.text()).toContain('Log In With Unraid.net');
  });

  it('does not render buttons when no OIDC providers are configured', async () => {
    mockUseQuery.mockReturnValue({
      result: { value: { publicOidcProviders: [] } },
      refetch: vi.fn().mockResolvedValue({ data: { publicOidcProviders: [] } }),
    });

    const wrapper = mount(SsoButtons, {
      global: {
        stubs: { 
          SsoProviderButton: SsoProviderButtonStub,
          Button: { template: '<button><slot /></button>' }
        },
      },
    });
    
    await flushPromises();
    vi.runAllTimers();
    await flushPromises();
    
    expect(wrapper.text()).not.toContain('or');
    expect(wrapper.findAll('button')).toHaveLength(0);
  });

  it('shows checking message while API is being polled', async () => {
    const refetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('API not available'))
      .mockResolvedValueOnce({ data: { publicOidcProviders: [] } });
    
    mockUseQuery.mockReturnValue({
      result: { value: null },
      refetch: refetchMock,
    });

    const wrapper = mount(SsoButtons, {
      global: {
        stubs: { 
          SsoProviderButton: SsoProviderButtonStub,
          Button: { template: '<button><slot /></button>' }
        },
      },
    });
    
    expect(wrapper.text()).toContain('Checking authentication options...');
    
    // Advance timers to trigger the polling
    await flushPromises();
    vi.advanceTimersByTime(2000);
    await flushPromises();
    
    // After successful API response, checking message should disappear
    expect(wrapper.text()).not.toContain('Checking authentication options...');
  });

  it('navigates to the OIDC provider URL on button click', async () => {
    const mockProviders = [
      { 
        id: 'unraid-net', 
        name: 'Unraid.net',
        buttonText: 'Log In With Unraid.net',
        buttonIcon: null,
        buttonVariant: 'secondary',
        buttonStyle: null
      }
    ];
    
    mockUseQuery.mockReturnValue({
      result: { value: { publicOidcProviders: mockProviders } },
      refetch: vi.fn().mockResolvedValue({ data: { publicOidcProviders: mockProviders } }),
    });

    const wrapper = mount(SsoButtons, {
      global: {
        stubs: { 
          SsoProviderButton: SsoProviderButtonStub,
          Button: { template: '<button><slot /></button>' }
        },
      },
    });
    
    await flushPromises();
    vi.runAllTimers();
    await flushPromises();

    const button = wrapper.find('button');
    await button.trigger('click');

    // Should set state and provider in sessionStorage
    expect(sessionStorage.setItem).toHaveBeenCalledWith('sso_state', expect.any(String));
    expect(sessionStorage.setItem).toHaveBeenCalledWith('sso_provider', 'unraid-net');

    const generatedState = (sessionStorage.setItem as Mock).mock.calls[0][1];
    const expectedUrl = `/graphql/api/auth/oidc/authorize/unraid-net?state=${encodeURIComponent(generatedState)}`;

    expect(mockLocation.href).toBe(expectedUrl);
  });

  it('handles OIDC callback with token successfully', async () => {
    const mockProviders = [
      { 
        id: 'unraid-net', 
        name: 'Unraid.net',
        buttonText: 'Log In With Unraid.net'
      }
    ];
    
    mockUseQuery.mockReturnValue({
      result: { value: { publicOidcProviders: mockProviders } },
      refetch: vi.fn().mockResolvedValue({ data: { publicOidcProviders: mockProviders } }),
    });

    const mockToken = 'mock_access_token_123';
    mockLocation.search = '';  // No query params - using hash instead
    mockLocation.pathname = '/login';
    mockLocationHref = `http://mock-origin.com/login#token=${mockToken}`;
    mockLocation.hash = `#token=${mockToken}`;

    // Mount the component so that onMounted hook is called
    mount(SsoButtons, {
      global: {
        stubs: { 
          SsoProviderButton: SsoProviderButtonStub,
          Button: { template: '<button><slot /></button>' }
        },
      },
    });

    await flushPromises();

    expect(mockForm.style.display).toBe('none');
    expect(mockUsernameField.value).toBe('root');
    expect(mockPasswordField.value).toBe(mockToken);
    expect(mockForm.requestSubmit).toHaveBeenCalledTimes(1);
    // Should clear the URL hash after processing
    expect(mockHistory.replaceState).toHaveBeenCalledWith({}, 'Mock Title', '/login');
  });

  it('handles OIDC callback error from backend', async () => {
    const mockProviders = [
      { 
        id: 'unraid-net', 
        name: 'Unraid.net',
        buttonText: 'Log In With Unraid.net'
      }
    ];
    
    mockUseQuery.mockReturnValue({
      result: { value: { publicOidcProviders: mockProviders } },
      refetch: vi.fn().mockResolvedValue({ data: { publicOidcProviders: mockProviders } }),
    });

    const errorMessage = 'Authentication failed';
    mockLocation.search = '';  // No query params - using hash instead
    mockLocation.pathname = '/login';
    mockLocationHref = `http://mock-origin.com/login#error=${encodeURIComponent(errorMessage)}`;
    mockLocation.hash = `#error=${encodeURIComponent(errorMessage)}`;
    
    const wrapper = mount(SsoButtons, {
      global: {
        stubs: { 
          SsoProviderButton: SsoProviderButtonStub,
          Button: { template: '<button><slot /></button>' }
        },
      },
    });

    await flushPromises();

    const errorElement = wrapper.find('p.text-red-500');
    expect(errorElement.exists()).toBe(true);
    expect(errorElement.text()).toBe(errorMessage);

    expect(mockForm.style.display).toBe('block');
    expect(mockForm.requestSubmit).not.toHaveBeenCalled();
    
    // The URL cleanup happens with both hash and query params being removed
    const expectedUrl = mockLocation.pathname;
    expect(mockHistory.replaceState).toHaveBeenCalledWith({}, 'Mock Title', expectedUrl);
  });

  it('redirects to OIDC callback endpoint when code and state are present', async () => {
    const mockProviders = [
      { 
        id: 'unraid-net', 
        name: 'Unraid.net',
        buttonText: 'Log In With Unraid.net'
      }
    ];
    
    mockUseQuery.mockReturnValue({
      result: { value: { publicOidcProviders: mockProviders } },
      refetch: vi.fn().mockResolvedValue({ data: { publicOidcProviders: mockProviders } }),
    });

    const mockCode = 'mock_auth_code';
    const mockState = 'mock_session_state_value';

    mockLocation.search = `?code=${mockCode}&state=${mockState}`;
    mockLocation.pathname = '/login';

    mount(SsoButtons, {
      global: {
        stubs: { 
          SsoProviderButton: SsoProviderButtonStub,
          Button: { template: '<button><slot /></button>' }
        },
      },
    });

    await flushPromises();

    // Should redirect to the OIDC callback endpoint
    const expectedUrl = `/graphql/api/auth/oidc/callback?code=${encodeURIComponent(mockCode)}&state=${encodeURIComponent(mockState)}`;
    expect(mockLocation.href).toBe(expectedUrl);
  });

  it('handles multiple OIDC providers', async () => {
    const mockProviders = [
      { 
        id: 'unraid-net', 
        name: 'Unraid.net',
        buttonText: 'Log In With Unraid.net',
        buttonIcon: null,
        buttonVariant: 'secondary',
        buttonStyle: null
      },
      { 
        id: 'google', 
        name: 'Google',
        buttonText: 'Sign in with Google',
        buttonIcon: 'https://google.com/icon.png',
        buttonVariant: 'outline',
        buttonStyle: 'background: white;'
      }
    ];
    
    mockUseQuery.mockReturnValue({
      result: { value: { publicOidcProviders: mockProviders } },
      refetch: vi.fn().mockResolvedValue({ data: { publicOidcProviders: mockProviders } }),
    });

    const wrapper = mount(SsoButtons, {
      global: {
        stubs: { 
          SsoProviderButton: SsoProviderButtonStub,
          Button: { template: '<button><slot /></button>' }
        },
      },
    });
    
    await flushPromises();
    vi.runAllTimers();
    await flushPromises();
    
    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(2);
    expect(wrapper.text()).toContain('Log In With Unraid.net');
    expect(wrapper.text()).toContain('Sign in with Google');
  });
});
