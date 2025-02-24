import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { ConnectService } from '@app/unraid-api/graph/connect/connect.service';

describe('ConnectService', () => {
    let service: ConnectService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ConnectService],
        }).compile();

        service = module.get<ConnectService>(ConnectService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
