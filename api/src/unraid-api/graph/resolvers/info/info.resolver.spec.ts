import type { TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { InfoResolver } from '@app/unraid-api/graph/resolvers/info/info.resolver.js';
import { InfoService } from '@app/unraid-api/graph/resolvers/info/info.service.js';

// Mock necessary modules
vi.mock('fs/promises', () => ({
    readFile: vi.fn().mockResolvedValue(''),
}));

vi.mock('@app/core/pubsub.js', () => ({
    pubsub: {
        publish: vi.fn().mockResolvedValue(undefined),
    },
    PUBSUB_CHANNEL: {
        INFO: 'info',
    },
}));

vi.mock('dockerode', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            listContainers: vi.fn(),
            listNetworks: vi.fn(),
        })),
    };
});

vi.mock('@app/store/index.js', () => ({
    getters: {
        paths: () => ({
            'docker-autostart': '/path/to/docker-autostart',
        }),
    },
}));

// Mock Cache Manager
const mockCacheManager = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
};

describe('InfoResolver', () => {
    let resolver: InfoResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InfoResolver,
                InfoService,
                DockerService,
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
            ],
        }).compile();

        resolver = module.get<InfoResolver>(InfoResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
