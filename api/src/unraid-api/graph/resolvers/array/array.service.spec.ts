import type { TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArrayRunningError } from '@app/core/errors/array-running-error.js';
import { getArrayData as getArrayDataUtil } from '@app/core/modules/array/get-array-data.js';
import { ParityCheckStatus } from '@app/core/modules/array/parity-check-status.js';
import { emcmd } from '@app/core/utils/clients/emcmd.js';
import {
    ArrayDiskInput,
    ArrayState,
    ArrayStateInput,
    ArrayStateInputState,
    UnraidArray,
} from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';

vi.mock('@app/core/utils/clients/emcmd.js', () => ({
    emcmd: vi.fn(),
}));

vi.mock('@app/core/modules/array/get-array-data.js', () => ({
    getArrayData: vi.fn(),
}));

vi.mock('@app/store/index.js', () => ({
    getters: {
        emhttp: vi.fn(),
    },
    store: {
        getState: vi.fn(),
    },
}));

describe('ArrayService', () => {
    let service: ArrayService;
    let mockArrayData: UnraidArray;
    let mockEmhttp: ReturnType<typeof vi.fn>;
    let mockGetState: ReturnType<typeof vi.fn>;
    let mockEmcmd: ReturnType<typeof vi.fn>;
    let mockGetArrayDataUtil: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        vi.resetAllMocks();

        const storeMock = await import('@app/store/index.js');
        mockEmhttp = vi.mocked(storeMock.getters.emhttp);
        mockGetState = vi.mocked(storeMock.store.getState);

        mockEmcmd = vi.mocked(emcmd);
        mockGetArrayDataUtil = vi.mocked(getArrayDataUtil);

        const module: TestingModule = await Test.createTestingModule({
            providers: [ArrayService],
        }).compile();

        service = module.get<ArrayService>(ArrayService);

        mockEmhttp.mockReturnValue({
            var: {
                mdState: ArrayState.STOPPED,
            },
        } as any);

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
            boot: undefined,
            parities: [],
            disks: [],
            caches: [],
            parityCheckStatus: ParityCheckStatus.NEVER_RUN,
        };
        mockGetArrayDataUtil.mockResolvedValue(mockArrayData);

        mockGetState.mockReturnValue({
            /* mock state if needed by getArrayDataUtil */
        });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getArrayData', () => {
        it('should call getArrayDataUtil with store.getState and return its result', async () => {
            const result = await service.getArrayData();
            expect(result).toEqual(mockArrayData);
            expect(mockGetArrayDataUtil).toHaveBeenCalledTimes(1);
            expect(mockGetArrayDataUtil).toHaveBeenCalledWith(mockGetState);
        });
    });

    describe('updateArrayState', () => {
        it('should START a STOPPED array', async () => {
            const input: ArrayStateInput = { desiredState: ArrayStateInputState.START };
            const expectedArrayData = { ...mockArrayData, state: ArrayState.STARTED };
            mockGetArrayDataUtil.mockResolvedValue(expectedArrayData);

            const result = await service.updateArrayState(input);

            expect(result).toEqual(expectedArrayData);
            expect(mockEmcmd).toHaveBeenCalledWith({
                cmdStart: 'Start',
                startState: 'STOPPED',
            });
            expect(mockGetArrayDataUtil).toHaveBeenCalledTimes(1);
        });

        it('should STOP a STARTED array', async () => {
            mockEmhttp.mockReturnValue({ var: { mdState: ArrayState.STARTED } } as any);
            const input: ArrayStateInput = { desiredState: ArrayStateInputState.STOP };
            const expectedArrayData = { ...mockArrayData, state: ArrayState.STOPPED };
            mockGetArrayDataUtil.mockResolvedValue(expectedArrayData);

            const result = await service.updateArrayState(input);

            expect(result).toEqual(expectedArrayData);
            expect(mockEmcmd).toHaveBeenCalledWith({
                cmdStop: 'Stop',
                startState: 'STARTED',
            });
            expect(mockGetArrayDataUtil).toHaveBeenCalledTimes(1);
        });

        it('should throw error if trying to START an already STARTED array', async () => {
            mockEmhttp.mockReturnValue({ var: { mdState: ArrayState.STARTED } } as any);
            const input: ArrayStateInput = { desiredState: ArrayStateInputState.START };

            await expect(service.updateArrayState(input)).rejects.toThrow(BadRequestException);
            expect(mockEmcmd).not.toHaveBeenCalled();
        });

        it('should throw error if trying to STOP an already STOPPED array', async () => {
            const input: ArrayStateInput = { desiredState: ArrayStateInputState.STOP };

            await expect(service.updateArrayState(input)).rejects.toThrow(BadRequestException);
            expect(mockEmcmd).not.toHaveBeenCalled();
        });
    });

    describe('addDiskToArray', () => {
        const input: ArrayDiskInput = { id: 'test-disk', slot: 1 };

        it('should add disk to array when STOPPED', async () => {
            const result = await service.addDiskToArray(input);
            expect(result).toEqual(mockArrayData);
            expect(mockEmcmd).toHaveBeenCalledWith({
                changeDevice: 'apply',
                'slotId.1': 'test-disk',
            });
            expect(mockGetArrayDataUtil).toHaveBeenCalledTimes(1);
        });

        it('should throw ArrayRunningError when array is STARTED', async () => {
            mockEmhttp.mockReturnValue({ var: { mdState: ArrayState.STARTED } } as any);
            await expect(service.addDiskToArray(input)).rejects.toThrow(new ArrayRunningError());
            expect(mockEmcmd).not.toHaveBeenCalled();
        });
    });

    describe('removeDiskFromArray', () => {
        const input: ArrayDiskInput = { id: 'test-disk', slot: 1 };

        it('should remove disk from array when STOPPED', async () => {
            const result = await service.removeDiskFromArray(input);
            expect(result).toEqual(mockArrayData);
            expect(mockEmcmd).toHaveBeenCalledWith({
                changeDevice: 'apply',
                'slotId.1': '',
            });
            expect(mockGetArrayDataUtil).toHaveBeenCalledTimes(1);
        });

        it('should throw ArrayRunningError when array is STARTED', async () => {
            mockEmhttp.mockReturnValue({ var: { mdState: ArrayState.STARTED } } as any);
            await expect(service.removeDiskFromArray(input)).rejects.toThrow(new ArrayRunningError());
            expect(mockEmcmd).not.toHaveBeenCalled();
        });
    });

    describe('mountArrayDisk', () => {
        const diskId = 'test-disk';

        it('should mount disk when array is STARTED', async () => {
            mockEmhttp.mockReturnValue({ var: { mdState: ArrayState.STARTED } } as any);
            const result = await service.mountArrayDisk(diskId);
            expect(result).toEqual(mockArrayData);
            expect(mockEmcmd).toHaveBeenCalledWith({
                mount: 'apply',
                [`diskId.${diskId}`]: '1',
            });
            expect(mockGetArrayDataUtil).toHaveBeenCalledTimes(1);
        });

        it('should throw BadRequestException when array is STOPPED', async () => {
            await expect(service.mountArrayDisk(diskId)).rejects.toThrow(
                new BadRequestException('Array must be running to mount disks')
            );
            expect(mockEmcmd).not.toHaveBeenCalled();
        });
    });

    describe('unmountArrayDisk', () => {
        const diskId = 'test-disk';

        it('should unmount disk when array is STARTED', async () => {
            mockEmhttp.mockReturnValue({ var: { mdState: ArrayState.STARTED } } as any);
            const result = await service.unmountArrayDisk(diskId);
            expect(result).toEqual(mockArrayData);
            expect(mockEmcmd).toHaveBeenCalledWith({
                unmount: 'apply',
                [`diskId.${diskId}`]: '1',
            });
            expect(mockGetArrayDataUtil).toHaveBeenCalledTimes(1);
        });

        it('should throw BadRequestException when array is STOPPED', async () => {
            await expect(service.unmountArrayDisk(diskId)).rejects.toThrow(
                new BadRequestException('Array must be running to unmount disks')
            );
            expect(mockEmcmd).not.toHaveBeenCalled();
        });
    });

    describe('clearArrayDiskStatistics', () => {
        const diskId = 'test-disk';

        it('should clear stats when array is STARTED', async () => {
            mockEmhttp.mockReturnValue({ var: { mdState: ArrayState.STARTED } } as any);
            const result = await service.clearArrayDiskStatistics(diskId);
            expect(result).toEqual(mockArrayData);
            expect(mockEmcmd).toHaveBeenCalledWith({
                clearStats: 'apply',
                [`diskId.${diskId}`]: '1',
            });
            expect(mockGetArrayDataUtil).toHaveBeenCalledTimes(1);
        });

        it('should throw BadRequestException when array is STOPPED', async () => {
            await expect(service.clearArrayDiskStatistics(diskId)).rejects.toThrow(
                new BadRequestException('Array must be running to clear disk statistics')
            );
            expect(mockEmcmd).not.toHaveBeenCalled();
        });
    });
});
