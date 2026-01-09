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

describe('DockerNetworkService', () => {
    let service: DockerNetworkService;

    beforeEach(async () => {
        mockListNetworks.mockReset();

        const module: TestingModule = await Test.createTestingModule({
            providers: [DockerNetworkService],
        }).compile();

        service = module.get<DockerNetworkService>(DockerNetworkService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getNetworks', () => {
        it('should fetch networks from docker', async () => {
            const rawNetworks = [
                {
                    Id: 'net1',
                    Name: 'test-net',
                    Driver: 'bridge',
                },
            ];
            mockListNetworks.mockResolvedValue(rawNetworks);

            const result = await service.getNetworks();
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('net1');
            expect(result[0].name).toBe('test-net');
            expect(mockListNetworks).toHaveBeenCalled();
        });

        it('should return empty array when no networks exist', async () => {
            mockListNetworks.mockResolvedValue([]);

            const result = await service.getNetworks();
            expect(result).toEqual([]);
            expect(mockListNetworks).toHaveBeenCalled();
        });
    });
});
