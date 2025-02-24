import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { ArrayResolver } from '@app/unraid-api/graph/resolvers/array/array.resolver.js';

describe('ArrayResolver', () => {
    let resolver: ArrayResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ArrayResolver],
        }).compile();

        resolver = module.get<ArrayResolver>(ArrayResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
