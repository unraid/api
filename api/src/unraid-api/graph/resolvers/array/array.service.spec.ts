import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArrayService } from './array.service.js';
import type { ArrayDiskInput, ArrayStateInput } from '@app/graphql/generated/api/types.js';
import { ArrayState, ArrayStateInputState } from '@app/graphql/generated/api/types.js';
import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { getters } from '@app/store/index.js';
import { getArrayData } from '@app/core/modules/array/get-array-data.js';

vi.mock('@app/core/utils/clients/emcmd.js', () => ({
    emcmd: vi.fn(),
}));

vi.mock('@app/store/index.js', () => ({
    getters: {
        emhttp: vi.fn(),
    },
}));

vi.mock('@app/core/modules/array/get-array-data.js', () => ({
    getArrayData: vi.fn(),
}));

describe('ArrayService', () => {
    let service: ArrayService;
    let mockArrayData: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ArrayService],
        }).compile();

        service = module.get<ArrayService>(ArrayService);

        // Mock getters.emhttp()
        vi.mocked(getters.emhttp).mockReturnValue({
            var: {
                mdState: ArrayState.STOPPED,
            },
        } as any);

        // Mock getArrayData
        mockArrayData = {
            id: 'array',
            state: ArrayState.STOPPED,
            capacity: {
                kilobytes: {
                    free: '1000',
                    used: '1000',
                    total: '2000',
                },
                disks: {
                    free: '10',
                    used: '5',
                    total: '15',
                },
            },
            boot: null,
            parities: [],
            disks: [],
            caches: [],
        };
        vi.mocked(getArrayData).mockReturnValue(mockArrayData);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should update array state', async () => {
        const input: ArrayStateInput = {
            desiredState: ArrayStateInputState.START,
        };
        const result = await service.updateArrayState(input);
        expect(result).toEqual(mockArrayData);
        expect(emcmd).toHaveBeenCalledWith({
            cmdStart: 'Start',
            startState: 'STOPPED',
        });
    });

    it('should add disk to array', async () => {
        const input: ArrayDiskInput = {
            id: 'test-disk',
            slot: 1,
        };
        const result = await service.addDiskToArray(input);
        expect(result).toEqual(mockArrayData);
        expect(emcmd).toHaveBeenCalledWith({
            changeDevice: 'apply',
            'slotId.1': 'test-disk',
        });
    });

    it('should remove disk from array', async () => {
        const input: ArrayDiskInput = {
            id: 'test-disk',
            slot: 1,
        };
        const result = await service.removeDiskFromArray(input);
        expect(result).toEqual(mockArrayData);
        expect(emcmd).toHaveBeenCalledWith({
            changeDevice: 'apply',
            'slotId.1': '',
        });
    });

    it('should mount array disk', async () => {
        // Mock array as running
        vi.mocked(getters.emhttp).mockReturnValue({
            var: {
                mdState: ArrayState.STARTED,
            },
        } as any);

        const result = await service.mountArrayDisk('test-disk');
        expect(result).toEqual(mockArrayData);
        expect(emcmd).toHaveBeenCalledWith({
            mount: 'apply',
            'diskId.test-disk': '1',
        });
    });

    it('should unmount array disk', async () => {
        // Mock array as running
        vi.mocked(getters.emhttp).mockReturnValue({
            var: {
                mdState: ArrayState.STARTED,
            },
        } as any);

        const result = await service.unmountArrayDisk('test-disk');
        expect(result).toEqual(mockArrayData);
        expect(emcmd).toHaveBeenCalledWith({
            unmount: 'apply',
            'diskId.test-disk': '1',
        });
    });

    it('should clear array disk statistics', async () => {
        // Mock array as running
        vi.mocked(getters.emhttp).mockReturnValue({
            var: {
                mdState: ArrayState.STARTED,
            },
        } as any);

        const result = await service.clearArrayDiskStatistics('test-disk');
        expect(result).toEqual(mockArrayData);
        expect(emcmd).toHaveBeenCalledWith({
            clearStats: 'apply',
            'diskId.test-disk': '1',
        });
    });

    it('should throw error when array is running for add disk', async () => {
        // Mock array as running
        vi.mocked(getters.emhttp).mockReturnValue({
            var: {
                mdState: ArrayState.STARTED,
            },
        } as any);

        const input: ArrayDiskInput = {
            id: 'test-disk',
            slot: 1,
        };
        await expect(service.addDiskToArray(input)).rejects.toThrow('Array needs to be stopped before any changes can occur.');
    });

    it('should throw error when array is running for remove disk', async () => {
        // Mock array as running
        vi.mocked(getters.emhttp).mockReturnValue({
            var: {
                mdState: ArrayState.STARTED,
            },
        } as any);

        const input: ArrayDiskInput = {
            id: 'test-disk',
            slot: 1,
        };
        await expect(service.removeDiskFromArray(input)).rejects.toThrow('Array needs to be stopped before any changes can occur.');
    });

    it('should throw error when array is not running for mount disk', async () => {
        await expect(service.mountArrayDisk('test-disk')).rejects.toThrow('Array must be running to mount disks');
    });

    it('should throw error when array is not running for unmount disk', async () => {
        await expect(service.unmountArrayDisk('test-disk')).rejects.toThrow('Array must be running to unmount disks');
    });

    it('should throw error when array is not running for clear disk statistics', async () => {
        await expect(service.clearArrayDiskStatistics('test-disk')).rejects.toThrow('Array must be running to clear disk statistics');
    });
}); 