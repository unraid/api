import { beforeEach, describe, expect, it, vi } from 'vitest';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { OnboardingInternalBootService } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-internal-boot.service.js';

vi.mock('@app/core/utils/clients/emcmd.js', () => ({
    emcmd: vi.fn(),
}));

describe('OnboardingInternalBootService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('runs the internal boot emcmd sequence and returns success', async () => {
        vi.mocked(emcmd).mockResolvedValue({ ok: true } as Awaited<ReturnType<typeof emcmd>>);
        const service = new OnboardingInternalBootService();

        const result = await service.createInternalBootPool({
            poolName: 'cache',
            devices: ['disk-1', 'disk-2'],
            bootSizeMiB: 16384,
            updateBios: true,
        });

        expect(result.ok).toBe(true);
        expect(result.code).toBe(0);
        expect(vi.mocked(emcmd)).toHaveBeenCalledTimes(5);
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
