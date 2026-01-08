import { CacheModule } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerLogService } from '@app/unraid-api/graph/resolvers/docker/docker-log.service.js';
import { DockerNetworkService } from '@app/unraid-api/graph/resolvers/docker/docker-network.service.js';
import { DockerPhpService } from '@app/unraid-api/graph/resolvers/docker/docker-php.service.js';
import { DockerPortService } from '@app/unraid-api/graph/resolvers/docker/docker-port.service.js';
import { DockerStatsService } from '@app/unraid-api/graph/resolvers/docker/docker-stats.service.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';
import { DockerModule } from '@app/unraid-api/graph/resolvers/docker/docker.module.js';
import { DockerMutationsResolver } from '@app/unraid-api/graph/resolvers/docker/docker.mutations.resolver.js';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DockerOrganizerConfigService } from '@app/unraid-api/graph/resolvers/docker/organizer/docker-organizer-config.service.js';
import { DockerOrganizerService } from '@app/unraid-api/graph/resolvers/docker/organizer/docker-organizer.service.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

describe('DockerModule', () => {
    it('should compile the module', async () => {
        const module = await Test.createTestingModule({
            imports: [CacheModule.register({ isGlobal: true }), DockerModule],
        })
            .overrideProvider(DockerService)
            .useValue({ getDockerClient: vi.fn() })
            .overrideProvider(DockerOrganizerConfigService)
            .useValue({ getConfig: vi.fn() })
            .overrideProvider(DockerConfigService)
            .useValue({ getConfig: vi.fn() })
            .overrideProvider(DockerLogService)
            .useValue({})
            .overrideProvider(DockerNetworkService)
            .useValue({})
            .overrideProvider(DockerPortService)
            .useValue({})
            .overrideProvider(SubscriptionTrackerService)
            .useValue({
                registerTopic: vi.fn(),
                subscribe: vi.fn(),
                unsubscribe: vi.fn(),
            })
            .overrideProvider(SubscriptionHelperService)
            .useValue({
                createTrackedSubscription: vi.fn(),
            })
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

    it('should provide DockerResolver', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DockerResolver,
                { provide: DockerService, useValue: {} },
                {
                    provide: DockerConfigService,
                    useValue: {
                        defaultConfig: vi
                            .fn()
                            .mockReturnValue({ templateMappings: {}, skipTemplatePaths: [] }),
                        getConfig: vi
                            .fn()
                            .mockReturnValue({ templateMappings: {}, skipTemplatePaths: [] }),
                        validate: vi.fn().mockImplementation((config) => Promise.resolve(config)),
                        replaceConfig: vi.fn(),
                    },
                },
                { provide: DockerOrganizerService, useValue: {} },
                { provide: DockerPhpService, useValue: { getContainerUpdateStatuses: vi.fn() } },
                {
                    provide: DockerTemplateScannerService,
                    useValue: {
                        scanTemplates: vi.fn(),
                        syncMissingContainers: vi.fn(),
                    },
                },
                {
                    provide: DockerStatsService,
                    useValue: {
                        startStatsStream: vi.fn(),
                        stopStatsStream: vi.fn(),
                    },
                },
                {
                    provide: SubscriptionTrackerService,
                    useValue: {
                        registerTopic: vi.fn(),
                    },
                },
                {
                    provide: SubscriptionHelperService,
                    useValue: {
                        createTrackedSubscription: vi.fn(),
                    },
                },
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
