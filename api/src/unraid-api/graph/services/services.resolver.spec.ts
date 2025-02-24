import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { ServicesResolver } from '@app/unraid-api/graph/services/services.resolver';

describe('ServicesResolver', () => {
    let resolver: ServicesResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ServicesResolver],
        }).compile();

        resolver = module.get<ServicesResolver>(ServicesResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
