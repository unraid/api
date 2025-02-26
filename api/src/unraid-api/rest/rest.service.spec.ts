import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { RestService } from '@app/unraid-api/rest/rest.service.js';

describe('RestService', () => {
    let service: RestService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RestService],
        }).compile();

        service = module.get<RestService>(RestService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
