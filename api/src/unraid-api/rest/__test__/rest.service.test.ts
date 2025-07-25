import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiReportService } from '@app/unraid-api/cli/api-report.service.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

const mockWriteFile = vi.fn();

vi.mock('node:fs/promises', () => ({
    writeFile: (...args: any[]) => mockWriteFile(...args),
    stat: vi.fn(),
}));

// Mock ApiReportService
const mockApiReportService = {
    generateReport: vi.fn(),
};

describe('RestService', () => {
    let restService: RestService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [RestService, { provide: ApiReportService, useValue: mockApiReportService }],
        }).compile();

        restService = module.get<RestService>(RestService);

        // Clear mocks
        vi.clearAllMocks();
    });

    describe('saveApiReport', () => {
        it('should generate report using ApiReportService and save to file', async () => {
            const mockReport = {
                timestamp: '2023-01-01T00:00:00.000Z',
                connectionStatus: {
                    running: 'yes' as const,
                },
                system: {
                    id: 'test-uuid',
                    name: 'Test Server',
                    version: '6.12.0',
                    machineId: 'REDACTED',
                    manufacturer: 'Test Manufacturer',
                    model: 'Test Model',
                },
                connect: {
                    installed: true,
                    dynamicRemoteAccess: {
                        enabledType: 'STATIC',
                        runningType: 'STATIC',
                        error: null,
                    },
                },
                config: {
                    valid: true,
                    error: null,
                },
                services: {
                    cloud: { name: 'cloud', online: true },
                    minigraph: { name: 'minigraph', online: false },
                    allServices: [],
                },
                remote: {
                    apikey: 'REDACTED',
                    localApiKey: 'REDACTED',
                    accesstoken: 'REDACTED',
                    idtoken: 'REDACTED',
                    refreshtoken: 'REDACTED',
                    ssoSubIds: 'REDACTED',
                    allowedOrigins: 'REDACTED',
                    email: 'REDACTED',
                },
            };

            const reportPath = '/tmp/test-report.json';
            mockApiReportService.generateReport.mockResolvedValue(mockReport);
            mockWriteFile.mockResolvedValue(undefined);

            await restService.saveApiReport(reportPath);

            // Verify ApiReportService was called (defaults to API running)
            expect(mockApiReportService.generateReport).toHaveBeenCalledWith();

            // Verify file was written with correct content
            expect(mockWriteFile).toHaveBeenCalledWith(
                reportPath,
                JSON.stringify(mockReport, null, 2),
                'utf-8'
            );
        });

        it('should handle ApiReportService errors gracefully', async () => {
            const reportPath = '/tmp/test-report.json';
            const error = new Error('Report generation failed');
            mockApiReportService.generateReport.mockRejectedValue(error);

            // Should not throw error
            await restService.saveApiReport(reportPath);

            // Verify ApiReportService was called
            expect(mockApiReportService.generateReport).toHaveBeenCalled();

            // Verify file write was not called due to error
            expect(mockWriteFile).not.toHaveBeenCalled();
        });

        it('should handle file write errors gracefully', async () => {
            const mockReport = {
                timestamp: '2023-01-01T00:00:00.000Z',
                system: { name: 'Test' },
            };

            const reportPath = '/tmp/test-report.json';
            mockApiReportService.generateReport.mockResolvedValue(mockReport);
            mockWriteFile.mockRejectedValue(new Error('File write failed'));

            // Should not throw error
            await restService.saveApiReport(reportPath);

            // Verify both service and file operations were attempted
            expect(mockApiReportService.generateReport).toHaveBeenCalled();
            expect(mockWriteFile).toHaveBeenCalledWith(
                reportPath,
                JSON.stringify(mockReport, null, 2),
                'utf-8'
            );
        });
    });
});
