import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { ConnectResolver } from '@app/unraid-api/graph/connect/connect.resolver.js';

import { ConnectService } from './connect.service.js';

describe('ConnectResolver', () => {
    let resolver: ConnectResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ConnectResolver, ConnectService],
        }).compile();

        resolver = module.get<ConnectResolver>(ConnectResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });
});
