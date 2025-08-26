import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerEventService } from '@app/unraid-api/graph/resolvers/docker/docker-event.service.js';
import { DockerOrganizerService } from '@app/unraid-api/graph/resolvers/docker/docker-organizer.service.js';
import { DockerPhpService } from '@app/unraid-api/graph/resolvers/docker/docker-php.service.js';
import { DockerModule } from '@app/unraid-api/graph/resolvers/docker/docker.module.js';
import { DockerMutationsResolver } from '@app/unraid-api/graph/resolvers/docker/docker.mutations.resolver.js';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

describe('DockerModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [DockerModule],
        })
            .overrideProvider(DockerService)
            .useValue({ getDockerClient: vi.fn() })
            .overrideProvider(DockerConfigService)
            .useValue({ getConfig: vi.fn() })
            .compile();

        expect(module).toBeDefined();
    });

    it('should provide DockerService', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: DockerService,
                    useValue: {
                        getDockerClient: vi.fn(),
                        debouncedContainerCacheUpdate: vi.fn(),
                    },
                },
            ],
        }).compile();

        const service = module.get<DockerService>(DockerService);
        expect(service).toBeDefined();
        expect(service).toHaveProperty('getDockerClient');
    });

    it('should provide DockerEventService', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DockerEventService,
                { provide: DockerService, useValue: { getDockerClient: vi.fn() } },
            ],
        }).compile();

        const service = module.get<DockerEventService>(DockerEventService);
        expect(service).toBeInstanceOf(DockerEventService);
    });

    it('should provide DockerResolver', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DockerResolver,
                { provide: DockerService, useValue: {} },
                { provide: DockerOrganizerService, useValue: {} },
                { provide: DockerPhpService, useValue: { getContainerUpdateStatuses: vi.fn() } },
            ],
        }).compile();

        const resolver = module.get<DockerResolver>(DockerResolver);
        expect(resolver).toBeInstanceOf(DockerResolver);
    });

    it('should provide DockerMutationsResolver', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DockerMutationsResolver, { provide: DockerService, useValue: {} }],
        }).compile();

        const resolver = module.get<DockerMutationsResolver>(DockerMutationsResolver);
        expect(resolver).toBeInstanceOf(DockerMutationsResolver);
    });
});
