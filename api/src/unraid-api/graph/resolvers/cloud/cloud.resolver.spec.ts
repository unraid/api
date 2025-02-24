import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { CloudResolver } from '@app/unraid-api/graph/resolvers/cloud/cloud.resolver';

describe('CloudResolver', () => {
    let resolver: CloudResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CloudResolver],
        }).compile();

        resolver = module.get<CloudResolver>(CloudResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
