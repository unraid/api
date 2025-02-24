import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { DisplayResolver } from '@app/unraid-api/graph/resolvers/display/display.resolver.js';

describe('DisplayResolver', () => {
    let resolver: DisplayResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DisplayResolver],
        }).compile();

        resolver = module.get<DisplayResolver>(DisplayResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
