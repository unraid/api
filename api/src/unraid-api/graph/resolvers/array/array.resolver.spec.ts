import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArrayResolver } from './array.resolver.js';
import { ArrayService } from './array.service.js';

describe('ArrayResolver', () => {
    let resolver: ArrayResolver;
    let arrayService: ArrayService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ArrayResolver,
                {
                    provide: ArrayService,
                    useValue: {
                        updateArrayState: vi.fn(),
                        addDiskToArray: vi.fn(),
                        removeDiskFromArray: vi.fn(),
                        mountArrayDisk: vi.fn(),
                        unmountArrayDisk: vi.fn(),
                        clearArrayDiskStatistics: vi.fn(),
                    },
                },
            ],
        }).compile();

        resolver = module.get<ArrayResolver>(ArrayResolver);
        arrayService = module.get<ArrayService>(ArrayService);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
