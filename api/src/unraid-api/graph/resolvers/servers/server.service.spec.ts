import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { GraphQLError } from 'graphql';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { getters, store } from '@app/store/index.js';
import { type SliceState } from '@app/store/modules/emhttp.js';
import { FileLoadStatus } from '@app/store/types.js';
import { AvahiService } from '@app/unraid-api/avahi/avahi.service.js';
import { ArrayState } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ServerService } from '@app/unraid-api/graph/resolvers/servers/server.service.js';
import { NginxService } from '@app/unraid-api/nginx/nginx.service.js';

vi.mock('@app/core/utils/clients/emcmd.js', () => ({
    emcmd: vi.fn(),
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

const createEmhttpState = ({
    name = 'Tower',
    comment = 'Tower comment',
    sysModel = 'Model X100',
    fsState = 'Stopped',
    mdState,
    sslEnabled = true,
    defaultUrl = 'https://Tower.local:4443',
    lanMdns = 'Tower.local',
    lanName = 'tower.local',
}: {
    name?: string;
    comment?: string;
    sysModel?: string;
    fsState?: string;
    mdState?: SliceState['var']['mdState'];
    sslEnabled?: boolean;
    defaultUrl?: string;
    lanMdns?: string;
    lanName?: string;
} = {}): SliceState => ({
    status: FileLoadStatus.LOADED,
    var: {
        name,
        comment,
        sysModel,
        fsState,
        mdState,
        regGuid: 'GUID-123',
        port: 80,
    } as unknown as SliceState['var'],
    devices: [],
    networks: [{ ipaddr: ['192.168.1.10'] }] as unknown as SliceState['networks'],
    nginx: {
        sslEnabled,
        defaultUrl,
        lanIp: '192.168.1.10',
        lanMdns,
        lanName,
    } as unknown as SliceState['nginx'],
    shares: [],
    disks: [],
    users: [],
    smbShares: [],
    nfsShares: [],
});

describe('ServerService', () => {
    let service: ServerService;
    let avahiService: { restart: ReturnType<typeof vi.fn> };
    let nginxService: { reload: ReturnType<typeof vi.fn> };
    let tempDirectory: string;
    let identConfigPath: string;

    beforeEach(async () => {
        vi.clearAllMocks();
        avahiService = {
            restart: vi.fn().mockResolvedValue(undefined),
        };
        nginxService = {
            reload: vi.fn().mockResolvedValue(true),
        };
        service = new ServerService(
            avahiService as unknown as AvahiService,
            nginxService as unknown as NginxService
        );
        tempDirectory = await mkdtemp(join(tmpdir(), 'server-service-'));
        identConfigPath = join(tempDirectory, 'boot/config/ident.cfg');

        vi.mocked(getters.emhttp).mockReturnValue(createEmhttpState());
        vi.mocked(getters.paths).mockReturnValue({
            identConfig: identConfigPath,
        } as ReturnType<typeof getters.paths>);
        vi.mocked(store.dispatch).mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({ nginx: {} }),
        } as unknown as ReturnType<typeof store.dispatch>);

        await mkdir(join(tempDirectory, 'boot/config'), { recursive: true });
        await writeFile(
            identConfigPath,
            'NAME="Tower"\nCOMMENT="Tower comment"\nSYS_MODEL="Model X100"\nEXTRA="keep-me"\n',
            'utf8'
        );

        vi.mocked(emcmd).mockImplementation(async (params) => {
            await writeFile(
                identConfigPath,
                `NAME="${params.NAME}"\nCOMMENT="${params.COMMENT}"\nSYS_MODEL="${params.SYS_MODEL}"\nEXTRA="keep-me"\n`,
                'utf8'
            );
            return { ok: true } as Awaited<ReturnType<typeof emcmd>>;
        });
    });

    afterEach(async () => {
        await rm(tempDirectory, { recursive: true, force: true });
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
        vi.mocked(getters.emhttp).mockReturnValue(
            createEmhttpState({
                fsState: 'Started',
                mdState: ArrayState.STARTED,
            })
        );

        await expect(service.updateServerIdentity('NewTower', 'desc')).rejects.toThrow(
            'The array must be stopped to change the server name.'
        );

        await expect(service.updateServerIdentity('Tower', 'desc')).resolves.toMatchObject({
            name: 'Tower',
            comment: 'desc',
        });
    });

    it('allows name change when mdState is STOPPED even if fsState is not Stopped', async () => {
        vi.mocked(getters.emhttp).mockReturnValue(
            createEmhttpState({
                comment: '',
                sysModel: '',
                fsState: 'Started',
                mdState: ArrayState.STOPPED,
            })
        );
        vi.mocked(store.dispatch).mockImplementation(() => {
            vi.mocked(getters.emhttp).mockReturnValue(
                createEmhttpState({
                    name: 'NewTower',
                    comment: 'desc',
                    sysModel: '',
                    fsState: 'Started',
                    mdState: ArrayState.STOPPED,
                    defaultUrl: 'https://NewTower.local:4443',
                    lanMdns: 'NewTower.local',
                    lanName: 'NewTower',
                })
            );

            return {
                unwrap: vi.fn().mockResolvedValue({ nginx: {} }),
            } as unknown as ReturnType<typeof store.dispatch>;
        });

        await expect(service.updateServerIdentity('NewTower', 'desc')).resolves.toMatchObject({
            name: 'NewTower',
        });
    });

    it('sends the Identification.page payload and persists ident.cfg', async () => {
        vi.mocked(emcmd).mockImplementation(async (params) => {
            await writeFile(
                identConfigPath,
                `NAME="${params.NAME}"\nCOMMENT="${params.COMMENT}"\nSYS_MODEL="${params.SYS_MODEL}"\nEXTRA="keep-me"\n`,
                'utf8'
            );
            return { ok: true } as Awaited<ReturnType<typeof emcmd>>;
        });
        vi.mocked(store.dispatch).mockImplementation(() => {
            vi.mocked(getters.emhttp).mockReturnValue(
                createEmhttpState({
                    name: 'Test1e',
                    comment: 'Test server1e',
                    sysModel: 'Model X200',
                    defaultUrl: 'https://Test1e.local:4443',
                    lanMdns: 'Test1e.local',
                    lanName: 'Test1e',
                })
            );

            return {
                unwrap: vi.fn().mockResolvedValue({ nginx: {} }),
            } as unknown as ReturnType<typeof store.dispatch>;
        });

        const result = await service.updateServerIdentity('Test1e', 'Test server1e', 'Model X200');

        expect(emcmd).toHaveBeenCalledWith(
            {
                changeNames: 'Apply',
                server_https: 'on',
                server_name: 'tower.local',
                server_addr: '192.168.1.10',
                NAME: 'Test1e',
                COMMENT: 'Test server1e',
                SYS_MODEL: 'Model X200',
            },
            { waitForToken: true }
        );

        await expect(readFile(identConfigPath, 'utf8')).resolves.toBe(
            'NAME="Test1e"\nCOMMENT="Test server1e"\nSYS_MODEL="Model X200"\nEXTRA="keep-me"\n'
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
            name: 'Test1e',
            comment: 'Test server1e',
            status: 'ONLINE',
            wanip: '',
            lanip: '192.168.1.10',
            localurl: 'http://192.168.1.10:80',
            remoteurl: '',
            defaultUrl: 'https://Test1e.local:4443',
        });
    });

    it('preserves current comment and model when omitted, like the webgui form does', async () => {
        vi.mocked(emcmd).mockImplementation(async (params) => {
            await writeFile(
                identConfigPath,
                `NAME="${params.NAME}"\nCOMMENT="${params.COMMENT}"\nSYS_MODEL="${params.SYS_MODEL}"\nEXTRA="keep-me"\n`,
                'utf8'
            );
            return { ok: true } as Awaited<ReturnType<typeof emcmd>>;
        });
        vi.mocked(store.dispatch).mockImplementation(() => {
            vi.mocked(getters.emhttp).mockReturnValue(
                createEmhttpState({
                    name: 'TowerRenamed',
                    comment: 'Tower comment',
                    sysModel: 'Model X100',
                    defaultUrl: 'https://TowerRenamed.local:4443',
                    lanMdns: 'TowerRenamed.local',
                    lanName: 'TowerRenamed',
                })
            );

            return {
                unwrap: vi.fn().mockResolvedValue({ nginx: {} }),
            } as unknown as ReturnType<typeof store.dispatch>;
        });

        await service.updateServerIdentity('TowerRenamed');

        expect(emcmd).toHaveBeenCalledWith(
            {
                changeNames: 'Apply',
                server_https: 'on',
                server_name: 'tower.local',
                server_addr: '192.168.1.10',
                NAME: 'TowerRenamed',
                COMMENT: 'Tower comment',
                SYS_MODEL: 'Model X100',
            },
            { waitForToken: true }
        );

        await expect(readFile(identConfigPath, 'utf8')).resolves.toBe(
            'NAME="TowerRenamed"\nCOMMENT="Tower comment"\nSYS_MODEL="Model X100"\nEXTRA="keep-me"\n'
        );
    });

    it('skips emcmd when identity values are unchanged', async () => {
        const before = await readFile(identConfigPath, 'utf8');
        const result = await service.updateServerIdentity('Tower', 'Tower comment', 'Model X100');

        expect(emcmd).not.toHaveBeenCalled();
        await expect(readFile(identConfigPath, 'utf8')).resolves.toBe(before);
        expect(result).toMatchObject({
            name: 'Tower',
            comment: 'Tower comment',
            lanip: '192.168.1.10',
        });
    });

    it('writes server_https as empty when ssl is disabled', async () => {
        vi.mocked(getters.emhttp).mockReturnValue(
            createEmhttpState({
                sslEnabled: false,
            })
        );

        await service.updateServerIdentity('Tower', 'Primary host', 'Model X100');

        expect(emcmd).toHaveBeenCalledWith(
            expect.objectContaining({
                server_https: '',
            }),
            { waitForToken: true }
        );
    });

    it('returns success when emcmd errors but ident.cfg has the requested identity', async () => {
        vi.mocked(emcmd).mockImplementation(async () => {
            await writeFile(
                identConfigPath,
                'NAME="Tower"\nCOMMENT="Primary host"\nSYS_MODEL="Model X100"\nEXTRA="keep-me"\n',
                'utf8'
            );
            throw new Error('socket failure');
        });

        await expect(service.updateServerIdentity('Tower', 'Primary host')).resolves.toMatchObject({
            name: 'Tower',
            comment: 'Primary host',
        });
        expect(avahiService.restart).not.toHaveBeenCalled();
        expect(nginxService.reload).not.toHaveBeenCalled();
    });

    it('restarts Avahi, reloads nginx, refreshes nginx state, and returns live defaultUrl after a name change', async () => {
        vi.mocked(store.dispatch).mockImplementation(() => {
            vi.mocked(getters.emhttp).mockReturnValue(
                createEmhttpState({
                    name: 'Test1e',
                    comment: 'Primary host',
                    sysModel: 'Model X100',
                    defaultUrl: 'https://Test1e.local:4443',
                    lanMdns: 'Test1e.local',
                    lanName: 'Test1e',
                })
            );

            return {
                unwrap: vi.fn().mockResolvedValue({ nginx: {} }),
            } as unknown as ReturnType<typeof store.dispatch>;
        });

        const result = await service.updateServerIdentity('Test1e', 'Primary host');

        expect(avahiService.restart).toHaveBeenCalledTimes(1);
        expect(nginxService.reload).toHaveBeenCalledTimes(1);
        expect(store.dispatch).toHaveBeenCalledTimes(1);
        expect(result).toMatchObject({
            name: 'Test1e',
            comment: 'Primary host',
            defaultUrl: 'https://Test1e.local:4443',
        });
    });

    it('skips Avahi restart and nginx refresh when only the comment changes', async () => {
        const result = await service.updateServerIdentity('Tower', 'Primary host');

        expect(avahiService.restart).not.toHaveBeenCalled();
        expect(nginxService.reload).not.toHaveBeenCalled();
        expect(store.dispatch).not.toHaveBeenCalled();
        expect(result).toMatchObject({
            name: 'Tower',
            comment: 'Primary host',
            defaultUrl: 'https://Tower.local:4443',
        });
    });

    it('fails when Avahi restart fails after ident.cfg has been updated', async () => {
        avahiService.restart.mockRejectedValue(new Error('avahi restart failed'));

        await expect(service.updateServerIdentity('Test1e', 'Primary host')).rejects.toMatchObject({
            message: 'Failed to update server identity',
            extensions: {
                cause: 'avahi restart failed',
                persistedIdentity: {
                    name: 'Test1e',
                    comment: 'Primary host',
                    sysModel: 'Model X100',
                },
            },
        });
        expect(nginxService.reload).not.toHaveBeenCalled();
    });

    it('fails when nginx reload fails after Avahi restart', async () => {
        nginxService.reload.mockResolvedValue(false);

        await expect(service.updateServerIdentity('Test1e', 'Primary host')).rejects.toMatchObject({
            message: 'Failed to update server identity',
            extensions: {
                cause: 'Nginx reload failed after Avahi restart',
                persistedIdentity: {
                    name: 'Test1e',
                    comment: 'Primary host',
                    sysModel: 'Model X100',
                },
            },
        });
    });

    it('fails when live nginx state stays stale after Avahi restart and nginx reload', async () => {
        vi.mocked(store.dispatch).mockReturnValue({
            unwrap: vi.fn().mockResolvedValue({ nginx: {} }),
        } as unknown as ReturnType<typeof store.dispatch>);

        await expect(service.updateServerIdentity('Test1e', 'Primary host')).rejects.toMatchObject({
            message: 'Failed to update server identity',
            extensions: {
                cause: 'Live network identity did not converge after Avahi restart and nginx reload',
                persistedIdentity: {
                    name: 'Test1e',
                    comment: 'Primary host',
                    sysModel: 'Model X100',
                },
                liveIdentity: {
                    lanName: 'tower.local',
                    lanMdns: 'Tower.local',
                    defaultUrl: 'https://Tower.local:4443',
                },
            },
        });
    });

    it('throws generic failure when emcmd fails and ident.cfg stays unchanged', async () => {
        vi.mocked(emcmd).mockRejectedValue(new Error('socket failure'));
        const before = await readFile(identConfigPath, 'utf8');

        await expect(service.updateServerIdentity('Tower', 'Primary host')).rejects.toMatchObject({
            message: 'Failed to update server identity',
            extensions: {
                cause: 'socket failure',
            },
        });

        await expect(readFile(identConfigPath, 'utf8')).resolves.toBe(before);
    });

    it('throws when emcmd succeeds but ident.cfg does not contain the requested identity', async () => {
        vi.mocked(emcmd).mockResolvedValue({ ok: true } as Awaited<ReturnType<typeof emcmd>>);

        await expect(service.updateServerIdentity('Tower', 'Primary host')).rejects.toMatchObject({
            message: 'Failed to update server identity',
            extensions: {
                cause: 'ident.cfg was not updated with the requested identity',
                persistedIdentity: {
                    name: 'Tower',
                    comment: 'Tower comment',
                    sysModel: 'Model X100',
                },
            },
        });
    });

    it('throws when persisted identity cannot be verified', async () => {
        vi.mocked(getters.paths).mockReturnValue({
            identConfig: join(tempDirectory, 'boot/config/missing-ident.cfg'),
        } as ReturnType<typeof getters.paths>);

        await expect(service.updateServerIdentity('Tower', 'Primary host')).rejects.toMatchObject({
            message: 'Failed to update server identity',
            extensions: {
                cause: expect.stringContaining('ENOENT'),
            },
        });
    });
});
