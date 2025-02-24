import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { VarsResolver } from '@app/unraid-api/graph/resolvers/vars/vars.resolver';

describe('VarsResolver', () => {
    let resolver: VarsResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [VarsResolver],
        }).compile();

        resolver = module.get<VarsResolver>(VarsResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
