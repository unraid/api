import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { SharesResolver } from '@app/unraid-api/graph/shares/shares.resolver';

describe('SharesResolver', () => {
    let resolver: SharesResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [SharesResolver],
        }).compile();

        resolver = module.get<SharesResolver>(SharesResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
