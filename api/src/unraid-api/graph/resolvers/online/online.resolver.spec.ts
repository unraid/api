import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { OnlineResolver } from '@app/unraid-api/graph/resolvers/online/online.resolver';

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
