import { readFile } from 'node:fs/promises';

import { got } from 'got';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { getters, store } from '@app/store/index.js';

vi.mock('node:fs/promises', async () => {
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    return {
        ...actual,
        readFile: vi.fn(),
    };
});

vi.mock('got', () => ({
    got: {
        post: vi.fn(),
    },
}));

vi.mock('@app/store/index.js', () => ({
    getters: {
        emhttp: vi.fn(),
        paths: vi.fn(),
    },
    store: {
        dispatch: vi.fn(),
    },
}));

describe('emcmd', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(getters.paths).mockReturnValue({
            'emhttpd-socket': '/var/run/emhttpd.socket',
        } as ReturnType<typeof getters.paths>);

        vi.mocked(getters.emhttp).mockReturnValue({
            var: {
                csrfToken: 'state-token',
            },
        } as ReturnType<typeof getters.emhttp>);

        vi.mocked(got.post).mockResolvedValue({
            body: '',
            statusCode: 200,
        } as Awaited<ReturnType<typeof got.post>>);
    });

    it('uses got over the emhttp unix socket', async () => {
        const result = await emcmd({
            changeNames: 'Apply',
            NAME: 'Hello',
        });

        expect(got.post).toHaveBeenCalledWith('http://unix:/var/run/emhttpd.socket:/update', {
            enableUnixSockets: true,
            body: 'changeNames=Apply&NAME=Hello&csrf_token=state-token',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            throwHttpErrors: false,
        });

        expect(result).toMatchObject({
            body: '',
            statusCode: 200,
        });
    });

    it('throws emhttp output when got returns a non-empty body', async () => {
        vi.mocked(got.post).mockResolvedValue({
            body: '<script>addLog("problem");</script>',
            statusCode: 200,
        } as Awaited<ReturnType<typeof got.post>>);

        await expect(emcmd({ changeNames: 'Apply' })).rejects.toThrow(
            '<script>addLog("problem");</script>'
        );
    });

    it('throws on http failures reported by got', async () => {
        vi.mocked(got.post).mockResolvedValue({
            body: '',
            statusCode: 500,
        } as Awaited<ReturnType<typeof got.post>>);

        await expect(emcmd({ changeNames: 'Apply' })).rejects.toThrow();
    });

    it('falls back to var.ini for the csrf token before retrying state loads', async () => {
        vi.mocked(getters.emhttp).mockReturnValue({
            var: {},
        } as ReturnType<typeof getters.emhttp>);
        vi.mocked(readFile).mockResolvedValue('csrf_token="ini-token"\n');

        await emcmd({ changeNames: 'Apply' });

        expect(readFile).toHaveBeenCalledWith('/var/local/emhttp/var.ini', 'utf-8');
        expect(store.dispatch).not.toHaveBeenCalled();
        expect(got.post).toHaveBeenCalledWith(
            'http://unix:/var/run/emhttpd.socket:/update',
            expect.objectContaining({
                body: 'changeNames=Apply&csrf_token=ini-token',
            })
        );
    });
});
