import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VmsResolver } from '@app/unraid-api/graph/resolvers/vms/vms.resolver.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';

describe('VmsResolver', () => {
    let resolver: VmsResolver;
    let vmsService: VmsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VmsResolver,
                {
                    provide: VmsService,
                    useValue: {
                        getDomains: vi.fn(),
                    },
                },
            ],
        }).compile();

        resolver = module.get<VmsResolver>(VmsResolver);
        vmsService = module.get<VmsService>(VmsService);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
