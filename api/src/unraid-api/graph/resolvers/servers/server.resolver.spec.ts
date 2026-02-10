import type { TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerResolver } from '@app/unraid-api/graph/resolvers/servers/server.resolver.js';
import { ServerService } from '@app/unraid-api/graph/resolvers/servers/server.service.js';

describe('ServersResolver', () => {
    let resolver: ServerResolver;

    beforeEach(async () => {
        const mockConfigService = {
            get: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ServerResolver,
                {
                    provide: ServerService,
                    useValue: {},
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        resolver = module.get<ServerResolver>(ServerResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
