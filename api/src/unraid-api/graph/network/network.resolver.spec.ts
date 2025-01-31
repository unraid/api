import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { NetworkResolver } from '@app/unraid-api/graph/network/network.resolver';

describe('NetworkResolver', () => {
    let resolver: NetworkResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [NetworkResolver],
        }).compile();

        resolver = module.get<NetworkResolver>(NetworkResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
