import { readFile } from 'node:fs/promises';

import { execa } from 'execa';
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

vi.mock('execa', () => ({
    execa: vi.fn(),
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

        vi.mocked(execa).mockResolvedValue({
            stdout: '',
            stderr: '',
            exitCode: 0,
            command: 'curl',
            escapedCommand: 'curl',
            failed: false,
            timedOut: false,
            isCanceled: false,
            killed: false,
        } as Awaited<ReturnType<typeof execa>>);
    });

    it('uses curl over the emhttp unix socket', async () => {
        const result = await emcmd({
            changeNames: 'Apply',
            NAME: 'Hello',
        });

        expect(execa).toHaveBeenCalledWith(
            'curl',
            [
                '--silent',
                '--show-error',
                '--unix-socket',
                '/var/run/emhttpd.socket',
                '--data',
                'changeNames=Apply&NAME=Hello&csrf_token=state-token',
                'http://localhost/update',
            ],
            { reject: false }
        );

        expect(result).toMatchObject({
            body: '',
            stderr: '',
            exitCode: 0,
        });
    });

    it('throws emhttp output when curl returns a non-empty body', async () => {
        vi.mocked(execa).mockResolvedValue({
            stdout: '<script>addLog("problem");</script>',
            stderr: '',
            exitCode: 0,
            command: 'curl',
            escapedCommand: 'curl',
            failed: false,
            timedOut: false,
            isCanceled: false,
            killed: false,
        } as Awaited<ReturnType<typeof execa>>);

        await expect(emcmd({ changeNames: 'Apply' })).rejects.toThrow(
            '<script>addLog("problem");</script>'
        );
    });

    it('throws curl stderr when the socket transport fails', async () => {
        vi.mocked(execa).mockResolvedValue({
            stdout: '',
            stderr: 'curl: (56) Recv failure',
            exitCode: 56,
            command: 'curl',
            escapedCommand: 'curl',
            failed: true,
            timedOut: false,
            isCanceled: false,
            killed: false,
        } as Awaited<ReturnType<typeof execa>>);

        await expect(emcmd({ changeNames: 'Apply' })).rejects.toThrow('curl: (56) Recv failure');
    });

    it('falls back to var.ini for the csrf token before retrying state loads', async () => {
        vi.mocked(getters.emhttp).mockReturnValue({
            var: {},
        } as ReturnType<typeof getters.emhttp>);
        vi.mocked(readFile).mockResolvedValue('csrf_token="ini-token"\n');

        await emcmd({ changeNames: 'Apply' });

        expect(readFile).toHaveBeenCalledWith('/var/local/emhttp/var.ini', 'utf-8');
        expect(store.dispatch).not.toHaveBeenCalled();
        expect(execa).toHaveBeenCalledWith(
            'curl',
            expect.arrayContaining(['--data', 'changeNames=Apply&csrf_token=ini-token']),
            { reject: false }
        );
    });
});
