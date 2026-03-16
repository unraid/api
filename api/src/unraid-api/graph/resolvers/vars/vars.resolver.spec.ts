import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { InternalBootStateService } from '@app/unraid-api/graph/resolvers/disks/internal-boot-state.service.js';
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
                {
                    provide: InternalBootStateService,
                    useValue: {
                        getBootedFromFlashWithInternalBootSetup: async () => false,
                    },
                },
            ],
        }).compile();

        resolver = module.get<VarsResolver>(VarsResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
