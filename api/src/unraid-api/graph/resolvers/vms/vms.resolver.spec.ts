import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { VmsResolver } from '@app/unraid-api/graph/resolvers/vms/vms.resolver';

describe('VmsResolver', () => {
    let resolver: VmsResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [VmsResolver],
        }).compile();

        resolver = module.get<VmsResolver>(VmsResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
