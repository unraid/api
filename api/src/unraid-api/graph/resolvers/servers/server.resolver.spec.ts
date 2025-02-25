import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { ServerResolver } from '@app/unraid-api/graph/resolvers/servers/server.resolver.js';

describe('ServersResolver', () => {
    let resolver: ServerResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ServerResolver],
        }).compile();

        resolver = module.get<ServerResolver>(ServerResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
