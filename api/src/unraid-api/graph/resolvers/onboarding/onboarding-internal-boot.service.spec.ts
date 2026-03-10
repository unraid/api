import { execa } from 'execa';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { getters } from '@app/store/index.js';
import { loadStateFileSync } from '@app/store/services/state-file-loader.js';
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

describe('OnboardingInternalBootService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getters.emhttp).mockReturnValue({
            devices: [],
            disks: [],
        } as unknown as ReturnType<typeof getters.emhttp>);
    });

    it('runs the internal boot emcmd sequence and returns success', async () => {
        vi.mocked(emcmd).mockResolvedValue({ ok: true } as Awaited<ReturnType<typeof emcmd>>);
        const service = new OnboardingInternalBootService();

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
    });

    it('runs efibootmgr update flow when updateBios is requested', async () => {
        vi.mocked(emcmd).mockResolvedValue({ ok: true } as Awaited<ReturnType<typeof emcmd>>);
        vi.mocked(getters.emhttp).mockReturnValue({
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
        const service = new OnboardingInternalBootService();

        const result = await service.createInternalBootPool({
            poolName: 'cache',
            devices: ['disk-1'],
            bootSizeMiB: 16384,
            updateBios: true,
        });

        expect(result.ok).toBe(true);
        expect(result.code).toBe(0);
        expect(result.output).toContain('BIOS boot entry updates completed successfully.');
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
            ['-c', '-d', '/dev/sda', '-p', '1', '-L', 'Unraid Flash'],
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
        const service = new OnboardingInternalBootService();

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
    });

    it('returns validation error for duplicate devices', async () => {
        const service = new OnboardingInternalBootService();

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
        expect(vi.mocked(emcmd)).not.toHaveBeenCalled();
    });

    it('returns validation error when a selected device uses USB transport', async () => {
        vi.mocked(getters.emhttp).mockReturnValue({
            devices: [{ id: 'disk-usb', device: 'sdc' }],
            disks: [
                {
                    id: 'USB-SERIAL',
                    device: 'sdc',
                    transport: 'USB',
                },
            ],
        } as unknown as ReturnType<typeof getters.emhttp>);
        const service = new OnboardingInternalBootService();

        const result = await service.createInternalBootPool({
            poolName: 'cache',
            devices: ['disk-usb'],
            bootSizeMiB: 16384,
            updateBios: false,
        });

        expect(result).toEqual({
            ok: false,
            code: 2,
            output: 'mkbootpool: USB devices are not eligible for internal boot: disk-usb',
        });
        expect(vi.mocked(emcmd)).not.toHaveBeenCalled();
    });

    it('returns failure output when emcmd command throws', async () => {
        vi.mocked(emcmd).mockRejectedValue(new Error('socket failure'));
        const service = new OnboardingInternalBootService();

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
    });
});
