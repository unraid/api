import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerPortService } from '@app/unraid-api/graph/resolvers/docker/docker-port.service.js';
import {
    ContainerPortType,
    DockerContainer,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';

vi.mock('@app/core/utils/network.js', () => ({
    getLanIp: vi.fn().mockReturnValue('192.168.1.100'),
}));

describe('DockerPortService', () => {
    let service: DockerPortService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DockerPortService],
        }).compile();

        service = module.get<DockerPortService>(DockerPortService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('deduplicateContainerPorts', () => {
        it('should deduplicate ports', () => {
            const ports = [
                { PrivatePort: 80, PublicPort: 80, Type: 'tcp' },
                { PrivatePort: 80, PublicPort: 80, Type: 'tcp' },
                { PrivatePort: 443, PublicPort: 443, Type: 'tcp' },
            ];
            // @ts-expect-error - types are loosely mocked
            const result = service.deduplicateContainerPorts(ports);
            expect(result).toHaveLength(2);
        });
    });

    describe('calculateConflicts', () => {
        it('should detect port conflicts', () => {
            const containers = [
                {
                    id: 'c1',
                    names: ['/web1'],
                    ports: [{ privatePort: 80, type: ContainerPortType.TCP }],
                },
                {
                    id: 'c2',
                    names: ['/web2'],
                    ports: [{ privatePort: 80, type: ContainerPortType.TCP }],
                },
            ] as DockerContainer[];

            const result = service.calculateConflicts(containers);
            expect(result.containerPorts).toHaveLength(1);
            expect(result.containerPorts[0].privatePort).toBe(80);
            expect(result.containerPorts[0].containers).toHaveLength(2);
        });

        it('should detect lan port conflicts', () => {
            const containers = [
                {
                    id: 'c1',
                    names: ['/web1'],
                    ports: [{ publicPort: 8080, type: ContainerPortType.TCP }],
                },
                {
                    id: 'c2',
                    names: ['/web2'],
                    ports: [{ publicPort: 8080, type: ContainerPortType.TCP }],
                },
            ] as DockerContainer[];

            const result = service.calculateConflicts(containers);
            expect(result.lanPorts).toHaveLength(1);
            expect(result.lanPorts[0].publicPort).toBe(8080);
            expect(result.lanPorts[0].containers).toHaveLength(2);
        });
    });
});
