import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { OwnerResolver } from '@app/unraid-api/graph/resolvers/owner/owner.resolver';

describe('OwnerResolver', () => {
    let resolver: OwnerResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [OwnerResolver],
        }).compile();

        resolver = module.get<OwnerResolver>(OwnerResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
