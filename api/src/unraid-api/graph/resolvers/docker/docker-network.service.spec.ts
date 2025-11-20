import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerNetworkService } from '@app/unraid-api/graph/resolvers/docker/docker-network.service.js';

const { mockDockerInstance, mockListNetworks } = vi.hoisted(() => {
    const mockListNetworks = vi.fn();
    const mockDockerInstance = {
        listNetworks: mockListNetworks,
    };
    return { mockDockerInstance, mockListNetworks };
});

vi.mock('@app/unraid-api/graph/resolvers/docker/utils/docker-client.js', () => ({
    getDockerClient: vi.fn().mockReturnValue(mockDockerInstance),
}));

const mockCacheManager = {
    get: vi.fn(),
    set: vi.fn(),
};

describe('DockerNetworkService', () => {
    let service: DockerNetworkService;

    beforeEach(async () => {
        mockListNetworks.mockReset();
        mockCacheManager.get.mockReset();
        mockCacheManager.set.mockReset();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DockerNetworkService,
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
            ],
        }).compile();

        service = module.get<DockerNetworkService>(DockerNetworkService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getNetworks', () => {
        it('should return cached networks if available and not skipped', async () => {
            const cached = [{ id: 'net1', name: 'test-net' }];
            mockCacheManager.get.mockResolvedValue(cached);

            const result = await service.getNetworks({ skipCache: false });
            expect(result).toEqual(cached);
            expect(mockListNetworks).not.toHaveBeenCalled();
        });

        it('should fetch networks from docker if cache skipped', async () => {
            const rawNetworks = [
                {
                    Id: 'net1',
                    Name: 'test-net',
                    Driver: 'bridge',
                },
            ];
            mockListNetworks.mockResolvedValue(rawNetworks);

            const result = await service.getNetworks({ skipCache: true });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('net1');
            expect(mockListNetworks).toHaveBeenCalled();
            expect(mockCacheManager.set).toHaveBeenCalledWith(
                DockerNetworkService.NETWORK_CACHE_KEY,
                expect.anything(),
                expect.anything()
            );
        });

        it('should fetch networks from docker if cache miss', async () => {
            mockCacheManager.get.mockResolvedValue(undefined);
            mockListNetworks.mockResolvedValue([]);

            await service.getNetworks({ skipCache: false });
            expect(mockListNetworks).toHaveBeenCalled();
        });
    });
});
