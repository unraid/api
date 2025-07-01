/**
 * SsoButton Component Test Coverage
 */

import { flushPromises, mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Mock, MockInstance } from 'vitest';

import SsoButton from '~/components/SsoButton.ce.vue';

const BrandButtonStub = {
  template: '<button><slot /></button>',
  props: ['disabled', 'variant', 'class'],
};

// Mock the GraphQL composable
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('~/helpers/urls', () => ({
  ACCOUNT: 'http://mock-account-url.net',
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
const mockLocation = {
  search: '',
  origin: 'http://mock-origin.com',
  pathname: '/login',
  href: '',
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

describe('SsoButton.ce.vue', () => {
  let querySelectorSpy: MockInstance;
  let mockUseQuery: Mock;

  beforeEach(async () => {
    vi.restoreAllMocks();

    // Get the mocked useQuery function
    const { useQuery } = await import('@vue/apollo-composable');
    mockUseQuery = useQuery as Mock;

    (sessionStorage.getItem as Mock).mockReturnValue(null);
    (sessionStorage.setItem as Mock).mockClear();
    mockForm.requestSubmit.mockClear();
    mockPasswordField.value = '';
    mockUsernameField.value = '';
    mockForm.style.display = 'block';
    mockLocation.search = '';
    mockLocation.href = '';
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
  });

  it('renders the button when SSO is enabled via GraphQL', () => {
    mockUseQuery.mockReturnValue({
      result: { value: { isSSOEnabled: true } }
    });

    const wrapper = mount(SsoButton, {
      global: {
        stubs: { BrandButton: BrandButtonStub },
      },
    });
    expect(wrapper.findComponent(BrandButtonStub).exists()).toBe(true);
    expect(wrapper.text()).toContain('or');
    expect(wrapper.text()).toContain('Log In With Unraid.net');
  });

  it('does not render the button when SSO is disabled via GraphQL', () => {
    mockUseQuery.mockReturnValue({
      result: { value: { isSSOEnabled: false } }
    });

    const wrapper = mount(SsoButton, {
      global: {
        stubs: { BrandButton: BrandButtonStub },
      },
    });
    expect(wrapper.findComponent(BrandButtonStub).exists()).toBe(false);
    expect(wrapper.text()).not.toContain('or');
  });

  it('does not render the button when GraphQL result is null/undefined', () => {
    mockUseQuery.mockReturnValue({
      result: { value: null }
    });

    const wrapper = mount(SsoButton, {
      global: {
        stubs: { BrandButton: BrandButtonStub },
      },
    });
    expect(wrapper.findComponent(BrandButtonStub).exists()).toBe(false);
    expect(wrapper.text()).not.toContain('or');
  });

  it('does not render the button when GraphQL result is undefined', () => {
    mockUseQuery.mockReturnValue({
      result: { value: undefined }
    });

    const wrapper = mount(SsoButton, {
      global: {
        stubs: { BrandButton: BrandButtonStub },
      },
    });
    expect(wrapper.findComponent(BrandButtonStub).exists()).toBe(false);
    expect(wrapper.text()).not.toContain('or');
  });

  it('navigates to the external SSO URL on button click', async () => {
    mockUseQuery.mockReturnValue({
      result: { value: { isSSOEnabled: true } }
    });

    const wrapper = mount(SsoButton, {
      global: {
        stubs: { BrandButton: BrandButtonStub },
      },
    });

    const button = wrapper.findComponent(BrandButtonStub);
    await button.trigger('click');

    expect(sessionStorage.setItem).toHaveBeenCalledTimes(1);
    expect(sessionStorage.setItem).toHaveBeenCalledWith('sso_state', expect.any(String));

    const generatedState = (sessionStorage.setItem as Mock).mock.calls[0][1];
    const expectedUrl = new URL('sso', 'http://mock-account-url.net');
    const expectedCallbackUrl = new URL('login', 'http://mock-origin.com');

    expectedUrl.searchParams.append('callbackUrl', expectedCallbackUrl.toString());
    expectedUrl.searchParams.append('state', generatedState);

    expect(mockLocation.href).toBe(expectedUrl.toString());
  });

  it('handles SSO callback in onMounted hook successfully', async () => {
    mockUseQuery.mockReturnValue({
      result: { value: { isSSOEnabled: true } }
    });

    const mockCode = 'mock_auth_code';
    const mockState = 'mock_session_state_value';
    const mockAccessToken = 'mock_access_token_123';

    mockLocation.search = `?code=${mockCode}&state=${mockState}`;
    (sessionStorage.getItem as Mock).mockReturnValue(mockState);
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: mockAccessToken }),
    } as Response);

    // Mount the component so that onMounted hook is called
    mount(SsoButton, {
      global: {
        stubs: { BrandButton: BrandButtonStub },
      },
    });

    await flushPromises();

    expect(sessionStorage.getItem).toHaveBeenCalledWith('sso_state');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(new URL('/api/oauth2/token', 'http://mock-account-url.net'), {
      method: 'POST',
      body: new URLSearchParams({
        code: mockCode,
        client_id: 'CONNECT_SERVER_SSO',
        grant_type: 'authorization_code',
      }),
    });
    expect(mockForm.style.display).toBe('none');
    expect(mockUsernameField.value).toBe('root');
    expect(mockPasswordField.value).toBe(mockAccessToken);
    expect(mockForm.requestSubmit).toHaveBeenCalledTimes(1);
    expect(mockHistory.replaceState).toHaveBeenCalledWith({}, 'Mock Title', '/login');
  });

  it('handles SSO callback error in onMounted hook', async () => {
    mockUseQuery.mockReturnValue({
      result: { value: { isSSOEnabled: true } }
    });

    const mockCode = 'mock_auth_code_error';
    const mockState = 'mock_session_state_error';

    mockLocation.search = `?code=${mockCode}&state=${mockState}`;
    (sessionStorage.getItem as Mock).mockReturnValue(mockState);

    const fetchError = new Error('Failed to fetch token');
    (fetch as Mock).mockRejectedValueOnce(fetchError);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(SsoButton, {
      global: {
        stubs: { BrandButton: BrandButtonStub },
      },
    });

    await flushPromises();

    expect(sessionStorage.getItem).toHaveBeenCalledWith('sso_state');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching token', fetchError);

    const errorElement = wrapper.find('p.text-red-500');

    expect(errorElement.exists()).toBe(true);
    expect(errorElement.text()).toBe('Error fetching token');

    const button = wrapper.findComponent(BrandButtonStub);

    expect(button.text()).toBe('Error');

    expect(mockForm.style.display).toBe('block');
    expect(mockForm.requestSubmit).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('handles SSO callback when state does not match', async () => {
    mockUseQuery.mockReturnValue({
      result: { value: { isSSOEnabled: true } }
    });

    const mockCode = 'mock_auth_code';
    const mockState = 'mock_session_state_value';
    const differentState = 'different_state_value';

    mockLocation.search = `?code=${mockCode}&state=${mockState}`;
    (sessionStorage.getItem as Mock).mockReturnValue(differentState);

    const wrapper = mount(SsoButton, {
      global: {
        stubs: { BrandButton: BrandButtonStub },
      },
    });

    await flushPromises();

    // Should not make any fetch calls when state doesn't match
    expect(fetch).not.toHaveBeenCalled();
    expect(mockForm.requestSubmit).not.toHaveBeenCalled();
    expect(wrapper.findComponent(BrandButtonStub).text()).toBe('Log In With Unraid.net');
  });

  it('handles SSO callback when no code is present', async () => {
    mockUseQuery.mockReturnValue({
      result: { value: { isSSOEnabled: true } }
    });

    mockLocation.search = '?state=some_state';
    (sessionStorage.getItem as Mock).mockReturnValue('some_state');

    const wrapper = mount(SsoButton, {
      global: {
        stubs: { BrandButton: BrandButtonStub },
      },
    });

    await flushPromises();

    // Should not make any fetch calls when no code is present
    expect(fetch).not.toHaveBeenCalled();
    expect(mockForm.requestSubmit).not.toHaveBeenCalled();
    expect(wrapper.findComponent(BrandButtonStub).text()).toBe('Log In With Unraid.net');
  });
});
