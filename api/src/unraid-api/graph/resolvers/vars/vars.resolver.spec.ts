import type { TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getters } from '@app/store/index.js';
import { ArrayDiskType } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';
import { InternalBootStateService } from '@app/unraid-api/graph/resolvers/disks/internal-boot-state.service.js';
import { VarsResolver } from '@app/unraid-api/graph/resolvers/vars/vars.resolver.js';
import { VarsService } from '@app/unraid-api/graph/resolvers/vars/vars.service.js';

vi.mock('@app/store/index.js', () => ({
    getters: {
        emhttp: vi.fn(),
    },
}));

describe('VarsResolver', () => {
    let resolver: VarsResolver;
    const cacheManager = {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
    };
    const internalBootStateService = {
        getBootedFromFlashWithInternalBootSetup: vi.fn(),
    };

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.mocked(getters.emhttp).mockReturnValue({
            var: {
                enableBootTransfer: 'yes',
            },
        } as unknown as ReturnType<typeof getters.emhttp>);
        internalBootStateService.getBootedFromFlashWithInternalBootSetup.mockResolvedValue(false);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VarsResolver,
                {
                    provide: VarsService,
                    useValue: {},
                },
                {
                    provide: InternalBootStateService,
                    useValue: internalBootStateService,
                },
            ],
        }).compile();

        resolver = module.get<VarsResolver>(VarsResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    it('returns vars with a safe null boot state when the shared lookup throws', async () => {
        const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
        internalBootStateService.getBootedFromFlashWithInternalBootSetup.mockRejectedValue(
            new Error('lookup failed')
        );

        const result = await resolver.vars();

        expect(result).toMatchObject({
            id: 'vars',
            enableBootTransfer: 'yes',
            bootedFromFlashWithInternalBootSetup: null,
        });
        expect(warnSpy).toHaveBeenCalledWith(
            'Failed to resolve bootedFromFlashWithInternalBootSetup in vars(): lookup failed'
        );
    });

    it('resolves vars via the lightweight internal boot lookup without scanning full disk inventory', async () => {
        const arrayService = {
            getArrayData: vi.fn().mockResolvedValue({
                boot: {
                    type: ArrayDiskType.FLASH,
                },
            }),
        };
        const disksService = {
            getInternalBootDeviceNames: vi.fn().mockResolvedValue(new Set(['/dev/nvme0n1'])),
            getInternalBootDevices: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VarsResolver,
                InternalBootStateService,
                {
                    provide: VarsService,
                    useValue: {},
                },
                {
                    provide: ArrayService,
                    useValue: arrayService,
                },
                {
                    provide: DisksService,
                    useValue: disksService,
                },
                {
                    provide: CACHE_MANAGER,
                    useValue: cacheManager,
                },
            ],
        }).compile();

        const realResolver = module.get<VarsResolver>(VarsResolver);

        const result = await realResolver.vars();

        expect(result).toMatchObject({
            id: 'vars',
            enableBootTransfer: 'yes',
            bootedFromFlashWithInternalBootSetup: true,
        });
        expect(arrayService.getArrayData).toHaveBeenCalledTimes(1);
        expect(disksService.getInternalBootDeviceNames).toHaveBeenCalledTimes(1);
        expect(disksService.getInternalBootDevices).not.toHaveBeenCalled();
    });
});
