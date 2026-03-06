import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  submitInternalBootCreation,
  submitInternalBootReboot,
} from '~/components/Onboarding/composables/internalBoot';

const mutateMock = vi.fn();

vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({
    client: {
      mutate: mutateMock,
    },
  }),
}));

describe('internalBoot composable', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mutateMock.mockReset();
    document.body.innerHTML = '';
    globalThis.csrf_token = 'csrf-token-value';
  });

  it('submits create internal boot pool via onboarding mutation', async () => {
    mutateMock.mockResolvedValue({
      data: {
        onboarding: {
          createInternalBootPool: {
            ok: true,
            code: 0,
            output: 'done',
          },
        },
      },
    });

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
    expect(mutateMock).toHaveBeenCalledTimes(1);
    const call = mutateMock.mock.calls[0]?.[0];
    expect(call).toBeDefined();
    if (!call || typeof call !== 'object') {
      return;
    }

    const payload = call as {
      variables?: {
        input?: {
          poolName?: string;
          devices?: string[];
          bootSizeMiB?: number;
          updateBios?: boolean;
          reboot?: boolean;
        };
      };
    };

    expect(payload.variables?.input).toEqual({
      poolName: 'cache',
      devices: ['disk-1'],
      bootSizeMiB: 16384,
      updateBios: true,
      reboot: false,
    });
  });

  it('returns fallback error when mutation response is empty', async () => {
    mutateMock.mockResolvedValue({
      data: {
        onboarding: {
          createInternalBootPool: null,
        },
      },
    });

    const result = await submitInternalBootCreation({
      poolName: 'cache',
      devices: ['disk-1'],
      bootSizeMiB: 16384,
      updateBios: true,
    });

    expect(result.ok).toBe(false);
    expect(result.output).toContain('Internal boot setup request failed');
  });

  it('returns structured failure when mutation throws', async () => {
    mutateMock.mockRejectedValue(new Error('network down'));

    const result = await submitInternalBootCreation({
      poolName: 'cache',
      devices: ['disk-1'],
      bootSizeMiB: 16384,
      updateBios: true,
    });

    expect(result.ok).toBe(false);
    expect(result.output).toContain('Internal boot setup request failed');
    expect(result.output).toContain('network down');
  });

  it('passes reboot flag when requested', async () => {
    mutateMock.mockResolvedValue({
      data: {
        onboarding: {
          createInternalBootPool: {
            ok: true,
            code: 0,
            output: 'done',
          },
        },
      },
    });

    await submitInternalBootCreation(
      {
        poolName: 'cache',
        devices: ['disk-1'],
        bootSizeMiB: 16384,
        updateBios: false,
      },
      { reboot: true }
    );

    const call = mutateMock.mock.calls[0]?.[0];
    expect(call).toBeDefined();
    if (!call || typeof call !== 'object') {
      return;
    }

    const payload = call as {
      variables?: {
        input?: {
          reboot?: boolean;
        };
      };
    };
    expect(payload.variables?.input?.reboot).toBe(true);
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
