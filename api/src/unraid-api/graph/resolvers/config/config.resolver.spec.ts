import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { ConfigResolver } from '@app/unraid-api/graph/resolvers/config/config.resolver';

describe('ConfigResolver', () => {
    let resolver: ConfigResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ConfigResolver],
        }).compile();

        resolver = module.get<ConfigResolver>(ConfigResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
