import { createPinia, setActivePinia } from 'pinia';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExternalKeyActions } from '@unraid/shared-callbacks';

import { resolveCallbackStatus } from '~/store/callbackActions.helpers';
import { useErrorsStore } from '~/store/errors';
import { useInstallKeyStore } from '~/store/installKey';

const action: ExternalKeyActions = {
  type: 'trialStart',
  keyUrl: 'https://keys.lime-technology.com/Trial.key',
};

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const createFetchController = () => {
  let resolveFetch: (response: Response) => void = () => {
    throw new Error('Fetch controller resolved before initialization');
  };
  let rejectFetch: (error: unknown) => void = () => {
    throw new Error('Fetch controller rejected before initialization');
  };
  const response = new Promise<Response>((resolve, reject) => {
    resolveFetch = resolve;
    rejectFetch = reject;
  });

  return {
    reject: rejectFetch,
    resolve: resolveFetch,
    response,
  };
};

const flushUnhandledRejections = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('InstallKey Store with real Wretch response chains', () => {
  const unhandledRejection = vi.fn();

  beforeEach(() => {
    setActivePinia(createPinia());
    globalThis.csrf_token = '';
    process.on('unhandledRejection', unhandledRejection);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.off('unhandledRejection', unhandledRejection);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    unhandledRejection.mockClear();
  });

  const startInstall = () => {
    const fetchController = createFetchController();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => fetchController.response)
    );
    const store = useInstallKeyStore();
    const installPromise = store.install(action);

    return { fetchController, installPromise, store };
  };

  it('stays installing until a delayed successful response is consumed', async () => {
    const { fetchController, installPromise, store } = startInstall();

    expect(store.keyInstallStatus).toBe('installing');
    await Promise.resolve();
    expect(store.keyInstallStatus).toBe('installing');

    fetchController.resolve(jsonResponse({ status: 'success', message: 'Key installed' }, 200));
    await installPromise;
    await flushUnhandledRejections();

    expect(store.keyInstallStatus).toBe('success');
    expect(unhandledRejection).not.toHaveBeenCalled();
  });

  it('turns a delayed HTTP 406 into callback error and preserves its safe message', async () => {
    const { fetchController, installPromise, store } = startInstall();

    expect(store.keyInstallStatus).toBe('installing');
    fetchController.resolve(jsonResponse({ error: 'download error 8' }, 406));
    await installPromise;
    await flushUnhandledRejections();

    expect(store.keyInstallStatus).toBe('failed');
    expect(store.keyUrl).toBe(action.keyUrl);
    expect(useErrorsStore().errors.at(-1)?.message).toBe('download error 8');
    expect(
      resolveCallbackStatus({
        actions: [action],
        accountActionStatus: 'ready',
        keyInstallStatus: store.keyInstallStatus,
      })
    ).toBe('error');
    expect(unhandledRejection).not.toHaveBeenCalled();
  });

  it('turns a delayed network rejection into callback error', async () => {
    const { fetchController, installPromise, store } = startInstall();

    expect(store.keyInstallStatus).toBe('installing');
    fetchController.reject(new TypeError('Failed to fetch'));
    await installPromise;
    await flushUnhandledRejections();

    expect(store.keyInstallStatus).toBe('failed');
    expect(store.keyUrl).toBe(action.keyUrl);
    expect(useErrorsStore().errors.at(-1)?.message).toBe('Failed to fetch');
    expect(
      resolveCallbackStatus({
        actions: [action],
        accountActionStatus: 'ready',
        keyInstallStatus: store.keyInstallStatus,
      })
    ).toBe('error');
    expect(unhandledRejection).not.toHaveBeenCalled();
  });
});
