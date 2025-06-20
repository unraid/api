import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { InfoResolver } from '@app/unraid-api/graph/resolvers/info/info.resolver.js';
import { InfoService } from '@app/unraid-api/graph/resolvers/info/info.service.js';

describe('InfoResolver', () => {
    let resolver: InfoResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [InfoResolver, InfoService],
        }).compile();

        resolver = module.get<InfoResolver>(InfoResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
