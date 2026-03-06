import { GraphQLError } from 'graphql';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { getters } from '@app/store/index.js';
import { ServerService } from '@app/unraid-api/graph/resolvers/servers/server.service.js';

vi.mock('@app/core/utils/clients/emcmd.js', () => ({
    emcmd: vi.fn(),
}));

vi.mock('@app/store/index.js', () => ({
    getters: {
        emhttp: vi.fn(),
    },
}));

describe('ServerService', () => {
    let service: ServerService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new ServerService();

        vi.mocked(getters.emhttp).mockReturnValue({
            var: {
                name: 'Tower',
                fsState: 'Stopped',
                regGuid: 'GUID-123',
                port: '80',
                comment: 'Tower comment',
            },
            networks: [{ ipaddr: ['192.168.1.10'] }],
        } as unknown as ReturnType<typeof getters.emhttp>);
        vi.mocked(emcmd).mockResolvedValue({ ok: true } as Awaited<ReturnType<typeof emcmd>>);
    });

    it('throws for invalid server name characters', async () => {
        await expect(service.updateServerIdentity('bad name!', 'test')).rejects.toThrow(GraphQLError);
        await expect(service.updateServerIdentity('bad name!', 'test')).rejects.toThrow(
            'Server name contains invalid characters'
        );
    });

    it('throws for server name longer than 15 chars', async () => {
        await expect(service.updateServerIdentity('1234567890123456', 'test')).rejects.toThrow(
            'Server name must be 15 characters or less.'
        );
    });

    it('throws when server name ends with dot or dash', async () => {
        await expect(service.updateServerIdentity('tower-', 'test')).rejects.toThrow(
            'Server name must not end with a dot or a dash.'
        );
        await expect(service.updateServerIdentity('tower.', 'test')).rejects.toThrow(
            'Server name must not end with a dot or a dash.'
        );
    });

    it('throws for invalid description length', async () => {
        await expect(service.updateServerIdentity('Tower', 'x'.repeat(65))).rejects.toThrow(
            'Server description must be 64 characters or less.'
        );
    });

    it('throws for invalid description characters', async () => {
        await expect(service.updateServerIdentity('Tower', 'bad "quote')).rejects.toThrow(
            'Server description cannot contain quotes or backslashes.'
        );
        await expect(service.updateServerIdentity('Tower', 'bad \\ slash')).rejects.toThrow(
            'Server description cannot contain quotes or backslashes.'
        );
    });

    it('throws for invalid model characters', async () => {
        await expect(service.updateServerIdentity('Tower', 'desc', 'bad "model')).rejects.toThrow(
            'Server model cannot contain quotes or backslashes.'
        );
        await expect(service.updateServerIdentity('Tower', 'desc', 'bad \\ model')).rejects.toThrow(
            'Server model cannot contain quotes or backslashes.'
        );
    });

    it('requires stopped array only when name changes', async () => {
        vi.mocked(getters.emhttp).mockReturnValue({
            var: {
                name: 'Tower',
                fsState: 'Started',
            },
        } as any);

        await expect(service.updateServerIdentity('NewTower', 'desc')).rejects.toThrow(
            'The array must be stopped to change the server name.'
        );

        await expect(service.updateServerIdentity('Tower', 'desc')).resolves.toMatchObject({
            name: 'Tower',
            comment: 'desc',
        });
    });

    it('calls emcmd with expected params and returns optimistic server', async () => {
        const result = await service.updateServerIdentity('Tower', 'Primary host');

        expect(emcmd).toHaveBeenCalledWith(
            {
                changeNames: 'Apply',
                NAME: 'Tower',
                COMMENT: 'Primary host',
            },
            { waitForToken: true }
        );

        expect(result).toEqual({
            id: 'local',
            owner: {
                id: 'local',
                username: 'root',
                url: '',
                avatar: '',
            },
            guid: 'GUID-123',
            apikey: '',
            name: 'Tower',
            comment: 'Primary host',
            status: 'ONLINE',
            wanip: '',
            lanip: '192.168.1.10',
            localurl: 'http://192.168.1.10:80',
            remoteurl: '',
        });
    });

    it('includes SYS_MODEL when provided', async () => {
        await service.updateServerIdentity('Tower', 'Primary host', 'Storinator');

        expect(emcmd).toHaveBeenCalledWith(
            {
                changeNames: 'Apply',
                NAME: 'Tower',
                COMMENT: 'Primary host',
                SYS_MODEL: 'Storinator',
            },
            { waitForToken: true }
        );
    });

    it('throws generic failure when emcmd fails', async () => {
        vi.mocked(emcmd).mockRejectedValue(new Error('socket failure'));

        await expect(service.updateServerIdentity('Tower', 'Primary host')).rejects.toThrow(
            'Failed to update server identity'
        );
    });
});
