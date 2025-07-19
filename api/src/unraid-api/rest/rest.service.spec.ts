import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiReportService } from '@app/unraid-api/cli/api-report.service.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

describe('RestService', () => {
    let service: RestService;

    beforeEach(async () => {
        const mockApiReportService = {
            generateReport: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RestService,
                {
                    provide: ApiReportService,
                    useValue: mockApiReportService,
                },
            ],
        }).compile();

        service = module.get<RestService>(RestService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
