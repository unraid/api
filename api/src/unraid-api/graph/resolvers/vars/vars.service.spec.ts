import { beforeEach, describe, expect, it, vi } from 'vitest';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { getters } from '@app/store/index.js';
import { VarsService } from '@app/unraid-api/graph/resolvers/vars/vars.service.js';

vi.mock('@app/core/utils/clients/emcmd.js', () => ({
    emcmd: vi.fn(),
}));

vi.mock('@app/store/index.js', () => ({
    getters: {
        emhttp: vi.fn(),
    },
}));

describe('VarsService', () => {
    let service: VarsService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new VarsService();

        vi.mocked(getters.emhttp).mockReturnValue({
            var: {
                startPage: 'Main',
                useTelnet: false,
                porttelnet: 23,
                useUpnp: false,
                useSsl: 'no',
                port: 80,
                portssl: 443,
                localTld: 'local',
            },
        } as any);

        vi.mocked(emcmd).mockResolvedValue({
            body: '',
            ok: true,
        } as any);
    });

    it('sends expected emcmd payload and returns optimistic vars', async () => {
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
    });

    it('uses safe defaults when current vars are missing', async () => {
        vi.mocked(getters.emhttp).mockReturnValue({ var: {} } as any);

        await service.updateSshSettings(false, 22);

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
    });

    it('swallows emcmd errors and still returns optimistic vars state', async () => {
        vi.mocked(emcmd).mockRejectedValue(new Error('connection reset'));

        await expect(service.updateSshSettings(true, 22)).resolves.toMatchObject({
            useSsh: true,
            portssh: 22,
        });
    });
});
