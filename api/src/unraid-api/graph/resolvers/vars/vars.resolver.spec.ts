import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { VarsResolver } from '@app/unraid-api/graph/resolvers/vars/vars.resolver.js';
import { VarsService } from '@app/unraid-api/graph/resolvers/vars/vars.service.js';

describe('VarsResolver', () => {
    let resolver: VarsResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VarsResolver,
                {
                    provide: VarsService,
                    useValue: {},
                },
            ],
        }).compile();

        resolver = module.get<VarsResolver>(VarsResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
