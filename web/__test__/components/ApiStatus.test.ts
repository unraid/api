/**
 * ApiStatus Component Test Coverage
 *
 * Regression coverage for the "wrong csrf_token" bug: the on-mount status
 * check must use the page-global csrf_token when the server store has not yet
 * hydrated its own `csrf` value, otherwise it sends a blank token and both
 * fails the status read and logs a red error in syslog.
 */

import { flushPromises, mount } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockWebguiUnraidApiCommand = vi.fn();

vi.mock('~/composables/services/webgui', () => ({
  WebguiUnraidApiCommand: (...args: unknown[]) => mockWebguiUnraidApiCommand(...args),
}));

const mockServerStore = { csrf: '' };
vi.mock('~/store/server', () => ({
  useServerStore: () => mockServerStore,
}));

import ApiStatus from '~/components/ApiStatus/ApiStatus.vue';

const mountComponent = () =>
  mount(ApiStatus, {
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
    },
  });

describe('ApiStatus.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerStore.csrf = '';
    mockWebguiUnraidApiCommand.mockResolvedValue({ result: 'API is running' });
    globalThis.csrf_token = 'global-token-123';
  });

  afterEach(() => {
    globalThis.csrf_token = '';
  });

  it('sends the page-global csrf_token on mount when the store has not hydrated', async () => {
    mountComponent();
    await flushPromises();

    expect(mockWebguiUnraidApiCommand).toHaveBeenCalledWith({
      csrf_token: 'global-token-123',
      command: 'status',
    });
  });

  it('never sends a blank csrf_token on mount', async () => {
    mountComponent();
    await flushPromises();

    const payload = mockWebguiUnraidApiCommand.mock.calls[0]?.[0];
    expect(payload.csrf_token).toBeTruthy();
  });

  it('prefers the store csrf value once it is populated', async () => {
    mockServerStore.csrf = 'store-token-456';
    mountComponent();
    await flushPromises();

    expect(mockWebguiUnraidApiCommand).toHaveBeenCalledWith({
      csrf_token: 'store-token-456',
      command: 'status',
    });
  });

  it('renders Running when the status result reports the service is running', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.text()).toContain('Running');
    expect(wrapper.text()).not.toContain('Not Running');
  });
});
