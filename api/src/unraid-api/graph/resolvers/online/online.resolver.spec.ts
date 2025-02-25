import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { OnlineResolver } from '@app/unraid-api/graph/resolvers/online/online.resolver.js';

describe('OnlineResolver', () => {
    let resolver: OnlineResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [OnlineResolver],
        }).compile();

        resolver = module.get<OnlineResolver>(OnlineResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
