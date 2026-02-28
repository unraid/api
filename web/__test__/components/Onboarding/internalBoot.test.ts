import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  submitInternalBootCreation,
  submitInternalBootReboot,
} from '~/components/Onboarding/composables/internalBoot';

describe('internalBoot composable', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    globalThis.csrf_token = 'csrf-token-value';
  });

  it('includes csrf token and args when creating internal boot pool', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          ok: true,
          code: 0,
          output: 'done',
        })
      ),
      status: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitInternalBootCreation({
      poolName: 'cache',
      devices: ['disk-1'],
      bootSizeMiB: 16384,
      updateBios: true,
    });

    expect(result).toEqual({
      ok: true,
      code: 0,
      output: 'done',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/plugins/dynamix/include/mkbootpool.php',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-csrf-token': 'csrf-token-value',
        }),
      })
    );

    const options = fetchMock.mock.calls[0]?.[1];
    expect(options).toBeDefined();
    if (!options || typeof options !== 'object') {
      return;
    }

    const body = (options as { body?: string }).body ?? '';
    expect(body).toContain('args%5B%5D=cache');
    expect(body).toContain('args%5B%5D=16384');
    expect(body).toContain('args%5B%5D=disk-1');
    expect(body).toContain('args%5B%5D=updatebios');
    expect(body).toContain('args%5B%5D=update');
    expect(body).toContain('csrf_token=csrf-token-value');
  });

  it('submits reboot form with cmd and csrf token', () => {
    const submitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => undefined);

    submitInternalBootReboot();

    expect(submitSpy).toHaveBeenCalledTimes(1);
    const form = document.querySelector('form');
    expect(form).toBeTruthy();
    if (!form) {
      return;
    }

    expect(form.method.toLowerCase()).toBe('post');
    expect(form.target).toBe('_top');
    expect(form.getAttribute('action')).toBe('/plugins/dynamix/include/Boot.php');

    const cmd = form.querySelector('input[name="cmd"]') as HTMLInputElement | null;
    expect(cmd?.value).toBe('reboot');
    const csrf = form.querySelector('input[name="csrf_token"]') as HTMLInputElement | null;
    expect(csrf?.value).toBe('csrf-token-value');
  });
});
