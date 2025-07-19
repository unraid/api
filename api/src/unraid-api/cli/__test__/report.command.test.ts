import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import {
    CONNECT_STATUS_QUERY,
    SERVICES_QUERY,
    SYSTEM_REPORT_QUERY,
} from '@app/unraid-api/cli/queries/system-report.query.js';
import { ReportCommand } from '@app/unraid-api/cli/report.command.js';

// Mock Apollo Client
const mockClient = {
    query: vi.fn(),
    stop: vi.fn(),
};

// Mock internal client service
const mockInternalClientService = {
    getClient: vi.fn().mockResolvedValue(mockClient),
    clearClient: vi.fn(),
};

// Mock log service
const mockLogService = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    clear: vi.fn(),
};

// Mock config service
const mockConfigService = {
    get: vi.fn(),
};

// Mock PM2 check
const mockIsUnraidApiRunning = vi.fn().mockResolvedValue(true);

vi.mock('@app/core/utils/pm2/unraid-api-running.js', () => ({
    isUnraidApiRunning: () => mockIsUnraidApiRunning(),
}));

describe('ReportCommand', () => {
    let reportCommand: ReportCommand;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                ReportCommand,
                { provide: LogService, useValue: mockLogService },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: CliInternalClientService, useValue: mockInternalClientService },
            ],
        }).compile();

        reportCommand = module.get<ReportCommand>(ReportCommand);

        // Clear mocks
        vi.clearAllMocks();

        // Reset PM2 mock to default
        mockIsUnraidApiRunning.mockResolvedValue(true);
    });

    describe('report', () => {
        it('should generate report using GraphQL when API is running', async () => {
            // Setup mock data for system report
            const mockSystemData = {
                info: {
                    id: 'info',
                    machineId: 'test-machine-id',
                    system: {
                        manufacturer: 'Test Manufacturer',
                        model: 'Test Model',
                        version: '1.0',
                        sku: 'TEST-SKU',
                        serial: 'TEST-SERIAL',
                        uuid: 'test-uuid',
                    },
                    versions: {
                        unraid: '6.12.0',
                        kernel: '5.19.17',
                        openssl: '3.0.8',
                    },
                },
                config: {
                    id: 'config',
                    valid: true,
                    error: null,
                },
                server: {
                    id: 'server',
                    name: 'Test Server',
                },
            };

            // Setup mock data for connect status
            const mockConnectData = {
                connect: {
                    id: 'connect',
                    dynamicRemoteAccess: {
                        enabledType: 'STATIC',
                        runningType: 'STATIC',
                        error: null,
                    },
                },
            };

            // Setup mock data for services
            const mockServicesData = {
                services: [
                    {
                        id: 'service-cloud',
                        name: 'cloud',
                        online: true,
                        uptime: { timestamp: '2023-01-01T00:00:00Z' },
                        version: '1.0.0',
                    },
                    {
                        id: 'service-minigraph',
                        name: 'minigraph',
                        online: false,
                        uptime: null,
                        version: '2.0.0',
                    },
                ],
            };

            // Configure mock to return different data based on query
            mockClient.query.mockImplementation(({ query }) => {
                if (query === SYSTEM_REPORT_QUERY) {
                    return Promise.resolve({ data: mockSystemData });
                } else if (query === CONNECT_STATUS_QUERY) {
                    return Promise.resolve({ data: mockConnectData });
                } else if (query === SERVICES_QUERY) {
                    return Promise.resolve({ data: mockServicesData });
                }
                return Promise.reject(new Error('Unknown query'));
            });

            await reportCommand.report();

            // Verify GraphQL client was used for all queries
            expect(mockInternalClientService.getClient).toHaveBeenCalled();
            expect(mockClient.query).toHaveBeenCalledWith({
                query: SYSTEM_REPORT_QUERY,
            });
            expect(mockClient.query).toHaveBeenCalledWith({
                query: CONNECT_STATUS_QUERY,
            });
            expect(mockClient.query).toHaveBeenCalledWith({
                query: SERVICES_QUERY,
            });

            // Verify report was logged
            expect(mockLogService.clear).toHaveBeenCalled();
            expect(mockLogService.info).toHaveBeenCalledWith(
                expect.stringContaining('"connectionStatus"')
            );
            expect(mockLogService.info).toHaveBeenCalledWith(expect.stringContaining('"system"'));
            expect(mockLogService.info).toHaveBeenCalledWith(expect.stringContaining('"connect"'));
            expect(mockLogService.info).toHaveBeenCalledWith(expect.stringContaining('"services"'));
        });

        it('should handle API not running gracefully', async () => {
            mockIsUnraidApiRunning.mockResolvedValue(false);

            await reportCommand.report();

            // Verify GraphQL client was not used
            expect(mockInternalClientService.getClient).not.toHaveBeenCalled();

            // Verify warning was logged
            expect(mockLogService.warn).toHaveBeenCalledWith(
                expect.stringContaining('API is not running')
            );
        });

        it('should handle GraphQL errors gracefully', async () => {
            const error = new Error('GraphQL connection failed');
            mockClient.query.mockImplementation(({ query }) => {
                if (query === SYSTEM_REPORT_QUERY) {
                    return Promise.reject(error);
                }
                return Promise.resolve({ data: {} });
            });

            await reportCommand.report();

            // Verify error was logged
            expect(mockLogService.debug).toHaveBeenCalledWith(
                expect.stringContaining('Error generating report via GraphQL')
            );
            expect(mockLogService.warn).toHaveBeenCalledWith(
                expect.stringContaining('Failed to generate system report')
            );
        });

        it('should redact sensitive information in report', async () => {
            // Setup mock data for system report with sensitive info
            const mockSystemData = {
                info: {
                    id: 'info',
                    machineId: 'sensitive-machine-id',
                    system: {
                        manufacturer: 'Test Manufacturer',
                        model: 'Test Model',
                        version: '1.0',
                        sku: 'TEST-SKU',
                        serial: 'TEST-SERIAL',
                        uuid: 'test-uuid',
                    },
                    versions: {
                        unraid: '6.12.0',
                        kernel: '5.19.17',
                        openssl: '3.0.8',
                    },
                },
                config: {
                    id: 'config',
                    valid: true,
                    error: null,
                },
                server: {
                    id: 'server',
                    name: 'Test Server',
                },
            };

            // Setup mock data for connect status
            const mockConnectData = {
                connect: {
                    id: 'connect',
                    dynamicRemoteAccess: {
                        enabledType: 'STATIC',
                        runningType: 'STATIC',
                        error: null,
                    },
                },
            };

            // Setup mock data for services
            const mockServicesData = {
                services: [],
            };

            // Configure mock to return different data based on query
            mockClient.query.mockImplementation(({ query }) => {
                if (query === SYSTEM_REPORT_QUERY) {
                    return Promise.resolve({ data: mockSystemData });
                } else if (query === CONNECT_STATUS_QUERY) {
                    return Promise.resolve({ data: mockConnectData });
                } else if (query === SERVICES_QUERY) {
                    return Promise.resolve({ data: mockServicesData });
                }
                return Promise.reject(new Error('Unknown query'));
            });

            await reportCommand.report();

            // Verify sensitive data is redacted
            expect(mockLogService.info).toHaveBeenCalled();
            const loggedData = mockLogService.info.mock.calls[0][0];
            const reportData = JSON.parse(loggedData);

            expect(reportData.system.machineId).toBe('REDACTED');
            expect(reportData.remote.apikey).toBe('REDACTED');
            expect(reportData.remote.localApiKey).toBe('REDACTED');
            expect(reportData.remote.accesstoken).toBe('REDACTED');
            expect(reportData.remote.idtoken).toBe('REDACTED');
            expect(reportData.remote.refreshtoken).toBe('REDACTED');
        });
    });
});
