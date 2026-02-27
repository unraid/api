import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArrayDiskType } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { OnboardingInternalBootService } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-internal-boot.service.js';

describe('OnboardingInternalBootService', () => {
    let service: OnboardingInternalBootService;
    const configGet = vi.fn();

    beforeEach(async () => {
        configGet.mockReset();

        const module = await Test.createTestingModule({
            providers: [
                OnboardingInternalBootService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: configGet,
                    },
                },
            ],
        }).compile();

        service = module.get(OnboardingInternalBootService);
    });

    it('builds onboarding internal boot context from emhttp state', () => {
        configGet.mockImplementation((key: string, fallback: unknown) => {
            switch (key) {
                case 'store.emhttp.var':
                    return {
                        fsState: 'Stopped',
                        bootEligible: true,
                        reservedNames: 'parity,disk1,cache',
                    };
                case 'store.emhttp.shares':
                    return [{ name: 'media' }, { name: 'isos' }, { name: 'media' }];
                case 'store.emhttp.disks':
                    return [
                        { type: ArrayDiskType.CACHE, name: 'cache' },
                        { type: ArrayDiskType.CACHE, name: 'pool1' },
                        { type: ArrayDiskType.DATA, name: 'disk1' },
                    ];
                case 'store.emhttp.devices':
                    return [
                        { id: 'MODEL_B', device: 'sdb', sectors: '20', sector_size: '1024' },
                        { id: 'MODEL_A', device: 'sda', sectors: '20', sector_size: '1024' },
                        { id: 'MODEL_C', device: 'sdc', sectors: '10', sector_size: '1024' },
                    ];
                default:
                    return fallback;
            }
        });

        const result = service.getContext();

        expect(result.fsState).toBe('Stopped');
        expect(result.bootEligible).toBe(true);
        expect(result.reservedNames).toEqual(['parity', 'disk1', 'cache']);
        expect(result.shareNames).toEqual(['media', 'isos']);
        expect(result.poolNames).toEqual(['cache', 'pool']);
        expect(result.defaultPoolName).toBe('');
        expect(result.maxSlots).toBe(2);
        expect(result.bootSizePresetsMiB).toEqual([16384, 32768, 65536, 131072]);
        expect(result.defaultBootSizeMiB).toBe(16384);
        expect(result.deviceOptions).toHaveLength(3);
        expect(result.deviceOptions[0]?.value).toBe('MODEL_A');
        expect(result.deviceOptions[1]?.value).toBe('MODEL_B');
        expect(result.deviceOptions[2]?.value).toBe('MODEL_C');
    });

    it('uses cache as default pool name when no pools exist', () => {
        configGet.mockImplementation((key: string, fallback: unknown) => {
            if (key === 'store.emhttp.var') {
                return { fsState: 'Stopped', bootEligible: false, reservedNames: '' };
            }
            return fallback;
        });

        const result = service.getContext();
        expect(result.poolNames).toEqual([]);
        expect(result.defaultPoolName).toBe('cache');
    });
});
