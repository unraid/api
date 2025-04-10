import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { ConnectService } from '@app/unraid-api/graph/resolvers/connect/connect.service.js';

describe('ConnectService', () => {
    let service: ConnectService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ConnectService, ApiKeyService],
        }).compile();

        service = module.get<ConnectService>(ConnectService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
