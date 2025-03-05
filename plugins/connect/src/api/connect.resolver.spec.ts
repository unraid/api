import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { ConnectResolver } from '@app/unraid-api/plugins/connect/api/connect.resolver.js';

describe('ConnectResolver', () => {
    let resolver: ConnectResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ConnectResolver],
        }).compile();

        resolver = module.get<ConnectResolver>(ConnectResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
