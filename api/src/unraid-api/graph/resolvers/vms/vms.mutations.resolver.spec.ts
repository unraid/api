import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VmMutationsResolver } from '@app/unraid-api/graph/resolvers/vms/vms.mutations.resolver.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';

describe('VmMutationsResolver', () => {
    let resolver: VmMutationsResolver;
    let vmsService: VmsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VmMutationsResolver,
                {
                    provide: VmsService,
                    useValue: {
                        startVm: vi.fn(),
                        stopVm: vi.fn(),
                    },
                },
            ],
        }).compile();

        resolver = module.get<VmMutationsResolver>(VmMutationsResolver);
        vmsService = module.get<VmsService>(VmsService);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    describe('startVm', () => {
        it('should call service.startVm with the provided id', async () => {
            const vmId = 'test-vm-id';
            vi.mocked(vmsService.startVm).mockResolvedValue(true);

            const result = await resolver.startVm(vmId);

            expect(result).toBe(true);
            expect(vmsService.startVm).toHaveBeenCalledWith(vmId);
        });

        it('should propagate errors from the service', async () => {
            const vmId = 'test-vm-id';
            const error = new Error('Failed to start VM');
            vi.mocked(vmsService.startVm).mockRejectedValue(error);

            await expect(resolver.startVm(vmId)).rejects.toThrow('Failed to start VM');
        });
    });

    describe('stopVm', () => {
        it('should call service.stopVm with the provided id', async () => {
            const vmId = 'test-vm-id';
            vi.mocked(vmsService.stopVm).mockResolvedValue(true);

            const result = await resolver.stopVm(vmId);

            expect(result).toBe(true);
            expect(vmsService.stopVm).toHaveBeenCalledWith(vmId);
        });

        it('should propagate errors from the service', async () => {
            const vmId = 'test-vm-id';
            const error = new Error('Failed to stop VM');
            vi.mocked(vmsService.stopVm).mockRejectedValue(error);

            await expect(resolver.stopVm(vmId)).rejects.toThrow('Failed to stop VM');
        });
    });
});
