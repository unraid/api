import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ILogService } from '@app/unraid-api/cli/log.service.js';
import { ApiReportService } from '@app/unraid-api/cli/api-report.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { ReportCommand } from '@app/unraid-api/cli/report.command.js';

// Mock log service
const mockLogService: ILogService = {
    shouldLog: vi.fn(),
    clear: vi.fn(),
    always: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
    table: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
};

// Mock ApiReportService
const mockApiReportService = {
    generateReport: vi.fn(),
};

// Mock process manager check
const mockIsUnraidApiRunning = vi.fn().mockResolvedValue(true);

vi.mock('@app/core/utils/process/unraid-api-running.js', () => ({
    isUnraidApiRunning: () => mockIsUnraidApiRunning(),
}));

describe('ReportCommand', () => {
    let reportCommand: ReportCommand;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                ReportCommand,
                { provide: LogService, useValue: mockLogService },
                { provide: ApiReportService, useValue: mockApiReportService },
            ],
        }).compile();

        reportCommand = module.get<ReportCommand>(ReportCommand);

        // Clear mocks
        vi.clearAllMocks();

        // Reset nodemon mock to default
        mockIsUnraidApiRunning.mockResolvedValue(true);
    });

    describe('report', () => {
        it('should generate report using ApiReportService when API is running', async () => {
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

            mockApiReportService.generateReport.mockResolvedValue(mockReport);

            await reportCommand.report();

            // Verify ApiReportService was called with correct parameter
            expect(mockApiReportService.generateReport).toHaveBeenCalledWith(true);

            // Verify report was logged
            expect(mockLogService.clear).toHaveBeenCalled();
            expect(mockLogService.always).toHaveBeenCalledWith(JSON.stringify(mockReport, null, 2));
        });

        it('should handle API not running gracefully', async () => {
            mockIsUnraidApiRunning.mockResolvedValue(false);

            await reportCommand.report();

            // Verify ApiReportService was not called
            expect(mockApiReportService.generateReport).not.toHaveBeenCalled();

            // Verify warning was logged
            expect(mockLogService.always).toHaveBeenCalledWith(
                expect.stringContaining('API is not running')
            );
        });

        it('should handle ApiReportService errors gracefully', async () => {
            const error = new Error('Report generation failed');
            mockApiReportService.generateReport.mockRejectedValue(error);

            await reportCommand.report();

            // Verify error was logged
            expect(mockLogService.debug).toHaveBeenCalledWith(
                expect.stringContaining('Error generating report via GraphQL')
            );
            expect(mockLogService.always).toHaveBeenCalledWith(
                expect.stringContaining('Failed to generate system report')
            );
        });

        it('should pass correct apiRunning parameter to ApiReportService', async () => {
            const mockReport = { timestamp: '2023-01-01T00:00:00.000Z' };
            mockApiReportService.generateReport.mockResolvedValue(mockReport);

            // Test with API running
            await reportCommand.report();
            expect(mockApiReportService.generateReport).toHaveBeenCalledWith(true);

            // Reset mocks
            vi.clearAllMocks();

            // Test with API running but status check returns true
            mockIsUnraidApiRunning.mockResolvedValue(true);
            await reportCommand.report();
            expect(mockApiReportService.generateReport).toHaveBeenCalledWith(true);
        });
    });
});
