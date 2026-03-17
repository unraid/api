import { Logger } from '@nestjs/common';

import { execa } from 'execa';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { getShares } from '@app/core/utils/shares/get-shares.js';
import { getters } from '@app/store/index.js';
import { loadStateFileSync } from '@app/store/services/state-file-loader.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';
import { InternalBootStateService } from '@app/unraid-api/graph/resolvers/disks/internal-boot-state.service.js';
import { OnboardingInternalBootService } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-internal-boot.service.js';

vi.mock('@app/core/utils/clients/emcmd.js', () => ({
    emcmd: vi.fn(),
}));

vi.mock('execa', () => ({
    execa: vi.fn(),
}));

vi.mock('@app/store/index.js', () => ({
    getters: {
        emhttp: vi.fn(),
    },
}));

vi.mock('@app/store/services/state-file-loader.js', () => ({
    loadStateFileSync: vi.fn(),
}));

vi.mock('@app/core/utils/shares/get-shares.js', () => ({
    getShares: vi.fn(),
}));

describe('OnboardingInternalBootService', () => {
    const internalBootStateService = {
        getBootedFromFlashWithInternalBootSetup: vi.fn(),
        invalidateCachedInternalBootDeviceState: vi.fn(),
    };
    const disksService = {
        getAssignableDisks: vi.fn(),
    } satisfies Pick<DisksService, 'getAssignableDisks'>;

    beforeEach(() => {
        vi.clearAllMocks();
        internalBootStateService.getBootedFromFlashWithInternalBootSetup.mockResolvedValue(false);
        internalBootStateService.invalidateCachedInternalBootDeviceState.mockResolvedValue(undefined);
        disksService.getAssignableDisks.mockResolvedValue([]);
        vi.mocked(getters.emhttp).mockReturnValue({
            var: {},
            devices: [],
            disks: [],
        } as unknown as ReturnType<typeof getters.emhttp>);
        vi.mocked(getShares).mockImplementation(((type?: string) => {
            if (type === 'users' || type === 'disks') {
                return [];
            }

            return {
                users: [],
                disks: [],
            };
        }) as unknown as typeof getShares);
    });

    const createService = () =>
        new OnboardingInternalBootService(
            internalBootStateService as unknown as InternalBootStateService,
            disksService as unknown as DisksService
        );

    it('builds internal boot context from the latest emhttp state', async () => {
        const assignableDisks = [
            {
                id: 'disk-1',
                device: '/dev/sda',
                serialNum: 'SERIAL-1',
                size: 1,
                interfaceType: 'SATA',
            },
        ];
        disksService.getAssignableDisks.mockResolvedValue(assignableDisks);
        vi.mocked(getters.emhttp).mockReturnValue({
            var: {
                mdState: 'STOPPED',
                bootEligible: true,
                enableBootTransfer: 'yes',
                reservedNames: 'flash,cache',
            },
            devices: [{ id: 'disk-1', device: 'sda' }],
            disks: [
                { type: 'CACHE', name: 'cache' },
                { type: 'CACHE', name: 'nvme' },
                { type: 'DATA', name: 'disk1' },
            ],
        } as unknown as ReturnType<typeof getters.emhttp>);
        vi.mocked(getShares).mockImplementation(((scope?: string) => {
            if (scope === 'users') {
                return [{ name: 'media' }];
            }
            if (scope === 'disks') {
                return [{ name: 'diskshare' }];
            }

            return {
                users: [{ name: 'media' }],
                disks: [{ name: 'diskshare' }],
            };
        }) as unknown as typeof getShares);

        const service = createService();
        const result = await service.getInternalBootContext();

        expect(result).toEqual({
            arrayStopped: true,
            bootEligible: true,
            bootedFromFlashWithInternalBootSetup: false,
            enableBootTransfer: 'yes',
            reservedNames: ['flash', 'cache'],
            shareNames: ['media', 'diskshare'],
            poolNames: ['cache', 'nvme'],
            assignableDisks,
        });
        expect(vi.mocked(loadStateFileSync)).not.toHaveBeenCalled();
    });

    it('refreshes internal boot context from disk and invalidates cached device state', async () => {
        const assignableDisks = [
            {
                id: 'disk-1',
                device: '/dev/sda',
                serialNum: 'SERIAL-1',
                size: 1,
                interfaceType: 'SATA',
            },
        ];
        disksService.getAssignableDisks.mockResolvedValue(assignableDisks);
        vi.mocked(getters.emhttp).mockReturnValue({
            var: {
                mdState: 'STOPPED',
                bootEligible: true,
                enableBootTransfer: 'yes',
                reservedNames: '',
            },
            devices: [{ id: 'disk-1', device: 'sda' }],
            disks: [{ type: 'CACHE', name: 'cache' }],
        } as unknown as ReturnType<typeof getters.emhttp>);

        const service = createService();
        const result = await service.refreshInternalBootContext();

        expect(internalBootStateService.invalidateCachedInternalBootDeviceState).toHaveBeenCalledTimes(
            1
        );
        expect(vi.mocked(loadStateFileSync)).toHaveBeenNthCalledWith(1, 'var');
        expect(vi.mocked(loadStateFileSync)).toHaveBeenNthCalledWith(2, 'devs');
        expect(vi.mocked(loadStateFileSync)).toHaveBeenNthCalledWith(3, 'disks');
        expect(result.assignableDisks).toEqual(assignableDisks);
    });

    it('runs the internal boot emcmd sequence and returns success', async () => {
        vi.mocked(emcmd).mockResolvedValue({ ok: true } as Awaited<ReturnType<typeof emcmd>>);
        const service = createService();

        const result = await service.createInternalBootPool({
            poolName: 'cache',
            devices: ['disk-1', 'disk-2'],
            bootSizeMiB: 16384,
            updateBios: false,
        });

        expect(result.ok).toBe(true);
        expect(result.code).toBe(0);
        expect(vi.mocked(emcmd)).toHaveBeenCalledTimes(5);
        expect(vi.mocked(execa)).not.toHaveBeenCalled();
        expect(vi.mocked(emcmd)).toHaveBeenNthCalledWith(
            1,
            { debug: 'cmdCreatePool,cmdAssignDisk,cmdMakeBootable' },
            { waitForToken: true }
        );
        expect(vi.mocked(emcmd)).toHaveBeenNthCalledWith(
            2,
            { cmdCreatePool: 'apply', poolName: 'cache', poolSlots: '2' },
            { waitForToken: true }
        );
        expect(vi.mocked(emcmd)).toHaveBeenNthCalledWith(
            3,
            { cmdAssignDisk: 'apply', diskName: 'cache', diskId: 'disk-1' },
            { waitForToken: true }
        );
        expect(vi.mocked(emcmd)).toHaveBeenNthCalledWith(
            4,
            { cmdAssignDisk: 'apply', diskName: 'cache2', diskId: 'disk-2' },
            { waitForToken: true }
        );
        expect(vi.mocked(emcmd)).toHaveBeenNthCalledWith(
            5,
            {
                cmdMakeBootable: 'apply',
                poolName: 'cache',
                poolBootSize: '16384',
            },
            { waitForToken: true }
        );
        expect(internalBootStateService.invalidateCachedInternalBootDeviceState).toHaveBeenCalledTimes(
            1
        );
    });

    it('runs efibootmgr update flow when updateBios is requested', async () => {
        vi.mocked(emcmd).mockResolvedValue({ ok: true } as Awaited<ReturnType<typeof emcmd>>);
        vi.mocked(getters.emhttp).mockReturnValue({
            var: { mdState: 'STOPPED' },
            devices: [{ id: 'disk-1', device: 'sdb' }],
            disks: [{ type: 'FLASH', device: 'sda' }],
        } as unknown as ReturnType<typeof getters.emhttp>);
        vi.mocked(execa)
            .mockResolvedValueOnce({
                stdout: 'Boot0001* Old Entry',
                stderr: '',
                exitCode: 0,
            } as Awaited<ReturnType<typeof execa>>)
            .mockResolvedValueOnce({
                stdout: '',
                stderr: '',
                exitCode: 0,
            } as Awaited<ReturnType<typeof execa>>)
            .mockResolvedValueOnce({
                stdout: '',
                stderr: '',
                exitCode: 0,
            } as Awaited<ReturnType<typeof execa>>)
            .mockResolvedValueOnce({
                stdout: '',
                stderr: '',
                exitCode: 0,
            } as Awaited<ReturnType<typeof execa>>)
            .mockResolvedValueOnce({
                stdout: 'Boot0003* Unraid Internal Boot - disk-1\nBoot0004* Unraid Flash',
                stderr: '',
                exitCode: 0,
            } as Awaited<ReturnType<typeof execa>>)
            .mockResolvedValueOnce({
                stdout: '',
                stderr: '',
                exitCode: 0,
            } as Awaited<ReturnType<typeof execa>>);
        const service = createService();

        const result = await service.createInternalBootPool({
            poolName: 'cache',
            devices: ['disk-1'],
            bootSizeMiB: 16384,
            updateBios: true,
        });

        expect(result.ok).toBe(true);
        expect(result.code).toBe(0);
        expect(result.output).toContain('BIOS boot entry updates completed successfully.');
        expect(internalBootStateService.invalidateCachedInternalBootDeviceState).toHaveBeenCalledTimes(
            1
        );
        expect(vi.mocked(emcmd)).toHaveBeenCalledTimes(4);
        expect(vi.mocked(loadStateFileSync)).not.toHaveBeenCalled();
        expect(vi.mocked(execa)).toHaveBeenNthCalledWith(1, 'efibootmgr', [], { reject: false });
        expect(vi.mocked(execa)).toHaveBeenNthCalledWith(2, 'efibootmgr', ['-b', '0001', '-B'], {
            reject: false,
        });
        expect(vi.mocked(execa)).toHaveBeenNthCalledWith(
            3,
            'efibootmgr',
            [
                '-c',
                '-d',
                '/dev/sdb',
                '-p',
                '2',
                '-L',
                'Unraid Internal Boot - disk-1',
                '-l',
                '\\EFI\\BOOT\\BOOTX64.EFI',
            ],
            { reject: false }
        );
        expect(vi.mocked(execa)).toHaveBeenNthCalledWith(
            4,
            'efibootmgr',
            ['-c', '-d', '/dev/sda', '-p', '1', '-L', 'Unraid Flash', '-l', '\\EFI\\BOOT\\BOOTX64.EFI'],
            { reject: false }
        );
        expect(vi.mocked(execa)).toHaveBeenNthCalledWith(5, 'efibootmgr', [], { reject: false });
        expect(vi.mocked(execa)).toHaveBeenNthCalledWith(
            6,
            'efibootmgr',
            ['-o', '0003,0004', '-n', '0003'],
            { reject: false }
        );
    });

    it('returns success and warning output when efibootmgr updates fail', async () => {
        vi.mocked(emcmd).mockResolvedValue({ ok: true } as Awaited<ReturnType<typeof emcmd>>);
        vi.mocked(execa)
            .mockResolvedValueOnce({
                stdout: '',
                stderr: 'Permission denied',
                exitCode: 1,
            } as Awaited<ReturnType<typeof execa>>)
            .mockResolvedValueOnce({
                stdout: '',
                stderr: 'No such file or directory',
                exitCode: 1,
            } as Awaited<ReturnType<typeof execa>>)
            .mockResolvedValueOnce({
                stdout: '',
                stderr: '',
                exitCode: 1,
            } as Awaited<ReturnType<typeof execa>>);
        const service = createService();

        const result = await service.createInternalBootPool({
            poolName: 'cache',
            devices: ['disk-1'],
            bootSizeMiB: 16384,
            updateBios: true,
        });

        expect(result.ok).toBe(true);
        expect(result.code).toBe(0);
        expect(result.output).toContain('efibootmgr failed for');
        expect(result.output).toContain(
            'BIOS boot entry updates completed with warnings; manual BIOS boot order changes may still be required.'
        );
        expect(internalBootStateService.invalidateCachedInternalBootDeviceState).toHaveBeenCalledTimes(
            1
        );
    });

    it('returns success when cache invalidation fails after setup and logs a warning', async () => {
        const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
        vi.mocked(emcmd).mockResolvedValue({ ok: true } as Awaited<ReturnType<typeof emcmd>>);
        internalBootStateService.invalidateCachedInternalBootDeviceState.mockRejectedValue(
            new Error('cache delete failed')
        );
        const service = createService();

        const result = await service.createInternalBootPool({
            poolName: 'cache',
            devices: ['disk-1'],
            bootSizeMiB: 16384,
            updateBios: false,
        });

        expect(result.ok).toBe(true);
        expect(result.code).toBe(0);
        expect(vi.mocked(emcmd)).toHaveBeenCalledTimes(4);
        expect(internalBootStateService.invalidateCachedInternalBootDeviceState).toHaveBeenCalledTimes(
            1
        );
        expect(warnSpy).toHaveBeenCalledWith(
            'Failed to invalidate cached internal boot device state after successful setup: cache delete failed'
        );
    });

    it('returns validation error for duplicate devices', async () => {
        const service = createService();

        const result = await service.createInternalBootPool({
            poolName: 'cache',
            devices: ['disk-1', 'disk-1'],
            bootSizeMiB: 16384,
            updateBios: false,
        });

        expect(result).toEqual({
            ok: false,
            code: 2,
            output: 'mkbootpool: duplicate device id: disk-1',
        });
        expect(internalBootStateService.invalidateCachedInternalBootDeviceState).not.toHaveBeenCalled();
        expect(vi.mocked(emcmd)).not.toHaveBeenCalled();
    });

    it('returns validation error when internal boot is already configured while booted from flash', async () => {
        internalBootStateService.getBootedFromFlashWithInternalBootSetup.mockResolvedValue(true);
        const service = createService();

        const result = await service.createInternalBootPool({
            poolName: 'cache',
            devices: ['disk-1'],
            bootSizeMiB: 16384,
            updateBios: false,
        });

        expect(result).toMatchObject({
            ok: false,
            code: 3,
        });
        expect(result.output).toContain('internal boot is already configured');
        expect(internalBootStateService.invalidateCachedInternalBootDeviceState).not.toHaveBeenCalled();
        expect(vi.mocked(emcmd)).not.toHaveBeenCalled();
    });

    it('returns failure output when the internal boot state lookup throws', async () => {
        internalBootStateService.getBootedFromFlashWithInternalBootSetup.mockRejectedValue(
            new Error('state lookup failed')
        );
        const service = createService();

        const result = await service.createInternalBootPool({
            poolName: 'cache',
            devices: ['disk-1'],
            bootSizeMiB: 16384,
            updateBios: false,
        });

        expect(result.ok).toBe(false);
        expect(result.code).toBe(1);
        expect(result.output).toContain('mkbootpool: command failed or timed out');
        expect(result.output).toContain('state lookup failed');
        expect(internalBootStateService.invalidateCachedInternalBootDeviceState).not.toHaveBeenCalled();
        expect(vi.mocked(emcmd)).not.toHaveBeenCalled();
    });

    it('returns failure output when emcmd command throws', async () => {
        vi.mocked(emcmd).mockRejectedValue(new Error('socket failure'));
        const service = createService();

        const result = await service.createInternalBootPool({
            poolName: 'cache',
            devices: ['disk-1'],
            bootSizeMiB: 16384,
            updateBios: false,
        });

        expect(result.ok).toBe(false);
        expect(result.code).toBe(1);
        expect(result.output).toContain('mkbootpool: command failed or timed out');
        expect(result.output).toContain('socket failure');
        expect(internalBootStateService.invalidateCachedInternalBootDeviceState).not.toHaveBeenCalled();
    });
});
