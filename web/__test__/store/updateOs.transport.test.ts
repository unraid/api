import { createPinia, setActivePinia } from 'pinia';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useUpdateOsStore } from '~/store/updateOs';

const { setUpdateOsResponse } = vi.hoisted(() => ({ setUpdateOsResponse: vi.fn() }));

vi.mock('~/store/callbackActions', () => ({
  useCallbackActionsStore: () => ({ send: vi.fn() }),
}));

vi.mock('~/store/server', () => ({
  useServerStore: () => ({
    regExp: '',
    regUpdatesExpired: false,
    updateOsIgnoredReleases: [],
    updateOsResponse: { version: '7.3.4', isNewer: true },
    setUpdateOsResponse,
  }),
}));

const updateResponse = (isNewer = true) => ({ version: '7.3.4', isNewer, isEligible: true });
const jsonResponse = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

describe('OS update check transport', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('preserves the last result on network failure and recovers on retry', async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse(updateResponse()));
    vi.stubGlobal('fetch', fetch);
    const store = useUpdateOsStore();

    await expect(store.localCheckForUpdate()).rejects.toThrow();
    expect(store.checkForUpdatesFailed).toBe(true);
    expect(store.checkForUpdatesLoading).toBe(false);
    expect(store.available).toBe('7.3.4');
    expect(setUpdateOsResponse).not.toHaveBeenCalled();

    await store.localCheckForUpdate();
    expect(store.checkForUpdatesFailed).toBe(false);
    expect(store.checkForUpdatesLoading).toBe(false);
    expect(setUpdateOsResponse).toHaveBeenCalledWith(updateResponse());
  });

  it.each([
    undefined,
    null,
    42,
    {},
    { error: 'Upstream unavailable' },
    { version: '7.3.4' },
    { version: '', isNewer: false },
    { version: '7.3.4', isNewer: 'false' },
  ])('rejects an invalid native result: %j', async (result) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(result)));
    const store = useUpdateOsStore();

    await expect(store.localCheckForUpdate()).rejects.toThrow();
    expect(store.checkForUpdatesFailed).toBe(true);
    expect(store.checkForUpdatesLoading).toBe(false);
    expect(setUpdateOsResponse).not.toHaveBeenCalled();
  });

  it('rejects an HTTP failure instead of clearing the last release', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    const store = useUpdateOsStore();

    await expect(store.localCheckForUpdate()).rejects.toThrow();
    expect(store.checkForUpdatesFailed).toBe(true);
    expect(store.checkForUpdatesLoading).toBe(false);
    expect(setUpdateOsResponse).not.toHaveBeenCalled();
  });

  it('accepts a successful native result with no newer release', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(updateResponse(false))));
    const store = useUpdateOsStore();

    await store.localCheckForUpdate();
    expect(store.checkForUpdatesFailed).toBe(false);
    expect(setUpdateOsResponse).toHaveBeenCalledWith(updateResponse(false));
  });
});
