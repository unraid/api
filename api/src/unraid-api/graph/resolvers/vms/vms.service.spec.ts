import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UnraidHypervisor } from '@app/core/utils/vms/get-hypervisor.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';

vi.mock('@app/core/utils/vms/get-hypervisor.js', () => ({
    UnraidHypervisor: {
        getInstance: vi.fn().mockReturnValue({
            getHypervisor: vi.fn(),
        }),
    },
}));

describe('VmsService', () => {
    let service: VmsService;
    let mockDomain: any;
    let mockHypervisor: any;

    beforeEach(async () => {
        mockDomain = {
            createAsync: vi.fn(),
            shutdownAsync: vi.fn(),
        };

        mockHypervisor = {
            lookupDomainByUUIDAsync: vi.fn().mockResolvedValue(mockDomain),
        };

        vi.mocked(UnraidHypervisor.getInstance().getHypervisor).mockResolvedValue(mockHypervisor);

        const module: TestingModule = await Test.createTestingModule({
            providers: [VmsService],
        }).compile();

        service = module.get<VmsService>(VmsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('startVm', () => {
        it('should start a VM successfully', async () => {
            const vmId = 'test-vm-id';
            vi.mocked(mockDomain.createAsync).mockResolvedValue(undefined);

            const result = await service.startVm(vmId);

            expect(result).toBe(true);
            expect(mockHypervisor.lookupDomainByUUIDAsync).toHaveBeenCalledWith(vmId);
            expect(mockDomain.createAsync).toHaveBeenCalled();
        });

        it('should handle errors when starting a VM', async () => {
            const vmId = 'test-vm-id';
            const error = new Error('Failed to create domain');
            vi.mocked(mockDomain.createAsync).mockRejectedValue(error);

            await expect(service.startVm(vmId)).rejects.toThrow(
                'Failed to start VM: Failed to create domain'
            );
        });
    });

    describe('stopVm', () => {
        it('should stop a VM successfully', async () => {
            const vmId = 'test-vm-id';
            vi.mocked(mockDomain.shutdownAsync).mockResolvedValue(undefined);

            const result = await service.stopVm(vmId);

            expect(result).toBe(true);
            expect(mockHypervisor.lookupDomainByUUIDAsync).toHaveBeenCalledWith(vmId);
            expect(mockDomain.shutdownAsync).toHaveBeenCalled();
        });

        it('should handle errors when stopping a VM', async () => {
            const vmId = 'test-vm-id';
            const error = new Error('Failed to shutdown domain');
            vi.mocked(mockDomain.shutdownAsync).mockRejectedValue(error);

            await expect(service.stopVm(vmId)).rejects.toThrow(
                'Failed to stop VM: Failed to shutdown domain'
            );
        });
    });
});
