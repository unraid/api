/**
 * request composable — global CSRF header attachment
 *
 * The webGUI CSRF gate rejects same-origin POSTs that lack a valid token. The
 * shared wretch instance must attach the page-global csrf_token as an
 * `x-csrf-token` header automatically (and only for same-origin requests).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { request } from '~/composables/services/request';

const okResponse = () =>
  new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('request csrf attachment', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal('fetch', fetchMock);
    globalThis.csrf_token = 'token-abc';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.csrf_token = '';
  });

  const headerFromCall = (index = 0) => {
    const opts = fetchMock.mock.calls[index]?.[1] ?? {};
    return new Headers(opts.headers).get('x-csrf-token');
  };

  it('attaches the page-global token on same-origin requests', async () => {
    await request.url('/plugins/dynamix.my.servers/include/unraid-api.php').post();
    expect(headerFromCall()).toBe('token-abc');
  });

  it('attaches the token on same-origin GET requests too', async () => {
    await request.url('/plugins/dynamix.my.servers/data/server-state.php').get();
    expect(headerFromCall()).toBe('token-abc');
  });

  it('does not attach the token to cross-origin requests', async () => {
    await request.url('https://wanip4.unraid.net/').get();
    expect(headerFromCall()).toBeNull();
  });

  it('attaches no header when the page global is unset', async () => {
    globalThis.csrf_token = '';
    await request.url('/webGui/include/Notify.php').post();
    expect(headerFromCall()).toBeNull();
  });
});
