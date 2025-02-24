import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { FlashResolver } from '@app/unraid-api/graph/resolvers/flash/flash.resolver';

describe('FlashResolver', () => {
    let resolver: FlashResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [FlashResolver],
        }).compile();

        resolver = module.get<FlashResolver>(FlashResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
