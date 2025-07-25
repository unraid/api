import { Test } from '@nestjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { ApiReportService } from '@app/unraid-api/cli/api-report.service.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

// Mock external dependencies
vi.mock('@app/store/index.js', () => ({
    getters: {
        paths: vi.fn(() => ({
            'log-base': '/tmp/logs',
        })),
    },
}));

vi.mock('execa', () => ({
    execa: vi.fn().mockResolvedValue({ stdout: 'mocked output' }),
}));

describe('RestService Dependencies', () => {
    it('should resolve ApiReportService dependency successfully', async () => {
        const mockApiReportService = {
            generateReport: vi.fn().mockResolvedValue({ timestamp: new Date().toISOString() }),
        };

        const module = await Test.createTestingModule({
            providers: [
                RestService,
                {
                    provide: ApiReportService,
                    useValue: mockApiReportService,
                },
            ],
        }).compile();

        const restService = module.get<RestService>(RestService);
        expect(restService).toBeDefined();
        expect(restService).toBeInstanceOf(RestService);

        await module.close();
    });

    it('should fail gracefully when ApiReportService is missing', async () => {
        // This test ensures we get a clear error when dependencies are missing
        await expect(
            Test.createTestingModule({
                providers: [RestService],
            }).compile()
        ).rejects.toThrow(/ApiReportService/);
    });
});
