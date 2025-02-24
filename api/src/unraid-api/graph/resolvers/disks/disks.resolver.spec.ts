import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { DisksResolver } from '@app/unraid-api/graph/resolvers/disks/disks.resolver';

describe('DisksResolver', () => {
    let resolver: DisksResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DisksResolver],
        }).compile();

        resolver = module.get<DisksResolver>(DisksResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
