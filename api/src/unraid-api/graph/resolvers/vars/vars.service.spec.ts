import { beforeEach, describe, expect, it, vi } from 'vitest';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { sleep } from '@app/core/utils/misc/sleep.js';
import { getters, store } from '@app/store/index.js';
import { loadSingleStateFile } from '@app/store/modules/emhttp.js';
import { VarsService } from '@app/unraid-api/graph/resolvers/vars/vars.service.js';

vi.mock('@app/core/utils/clients/emcmd.js', () => ({
    emcmd: vi.fn(),
}));

vi.mock('@app/core/utils/misc/sleep.js', () => ({
    sleep: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@app/store/modules/emhttp.js', () => ({
    loadSingleStateFile: vi.fn((key: unknown) => key),
}));

vi.mock('@app/store/index.js', () => ({
    getters: {
        emhttp: vi.fn(),
    },
    store: {
        dispatch: vi.fn(),
    },
}));

describe('VarsService', () => {
    let service: VarsService;
    let currentVarState: Record<string, unknown>;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new VarsService();

        currentVarState = {
            startPage: 'Main',
            useTelnet: false,
            porttelnet: 23,
            useUpnp: false,
            useSsl: 'no',
            port: 80,
            portssl: 443,
            localTld: 'local',
            useSsh: false,
            portssh: 22,
        };

        vi.mocked(getters.emhttp).mockImplementation(
            () =>
                ({
                    var: currentVarState,
                }) as any
        );

        vi.mocked(emcmd).mockResolvedValue({
            body: '',
            ok: true,
        } as any);

        vi.mocked(store.dispatch).mockImplementation(
            () =>
                ({
                    unwrap: vi.fn().mockResolvedValue({
                        var: currentVarState,
                    }),
                }) as any
        );
    });

    it('sends expected emcmd payload and returns verified vars when state converges', async () => {
        vi.mocked(store.dispatch).mockImplementation(() => {
            currentVarState = {
                ...currentVarState,
                useSsh: true,
                portssh: 2222,
            };
            return {
                unwrap: vi.fn().mockResolvedValue({
                    var: currentVarState,
                }),
            } as any;
        });

        const result = await service.updateSshSettings(true, 2222);

        expect(emcmd).toHaveBeenCalledWith(
            {
                changePorts: 'Apply',
                server_name: 'localhost',
                server_addr: '127.0.0.1',
                START_PAGE: 'Main',
                USE_TELNET: 'no',
                PORTTELNET: '23',
                USE_SSH: 'yes',
                PORTSSH: '2222',
                USE_UPNP: 'no',
                USE_SSL: 'no',
                PORT: '80',
                PORTSSL: '443',
                LOCAL_TLD: 'local',
            },
            { waitForToken: false }
        );

        expect(result).toMatchObject({
            id: 'vars',
            useSsh: true,
            portssh: 2222,
        });
        expect(loadSingleStateFile).toHaveBeenCalled();
    });

    it('uses safe defaults when current vars are missing', async () => {
        currentVarState = {};

        const result = await service.updateSshSettings(false, 22);

        expect(emcmd).toHaveBeenCalledWith(
            expect.objectContaining({
                START_PAGE: 'Main',
                USE_TELNET: 'no',
                PORTTELNET: '23',
                USE_SSH: 'no',
                PORTSSH: '22',
                USE_UPNP: 'no',
                USE_SSL: 'no',
                PORT: '80',
                PORTSSL: '443',
                LOCAL_TLD: 'local',
            }),
            { waitForToken: false }
        );
        expect(result).toMatchObject({
            useSsh: false,
            portssh: 22,
        });
    });

    it('swallows emcmd errors and returns last observed vars when unverifiable', async () => {
        vi.mocked(emcmd).mockRejectedValue(new Error('connection reset'));

        vi.mocked(store.dispatch).mockImplementation(
            () =>
                ({
                    unwrap: vi.fn().mockRejectedValue(new Error('store refresh failed')),
                }) as any
        );

        await expect(service.updateSshSettings(true, 22)).resolves.toMatchObject({
            useSsh: false,
            portssh: 22,
        });
        expect(sleep).toHaveBeenCalled();
    });
});
