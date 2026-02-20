import { Test } from '@nestjs/testing';

import type { CanonicalInternalClientService } from '@unraid/shared';
import { CANONICAL_INTERNAL_CLIENT_TOKEN } from '@unraid/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiReportService } from '@app/unraid-api/cli/api-report.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import {
    CONNECT_STATUS_QUERY,
    SERVICES_QUERY,
    SYSTEM_REPORT_QUERY,
} from '@app/unraid-api/cli/queries/system-report.query.js';

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
    error: vi.fn(),
    clear: vi.fn(),
};

describe('ApiReportService', () => {
    let apiReportService: ApiReportService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                ApiReportService,
                { provide: LogService, useValue: mockLogService },
                { provide: CANONICAL_INTERNAL_CLIENT_TOKEN, useValue: mockInternalClientService },
            ],
        }).compile();

        apiReportService = module.get<ApiReportService>(ApiReportService);

        // Clear mocks
        vi.clearAllMocks();
    });

    describe('generateReport', () => {
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
                    core: {
                        unraid: '6.12.0',
                        kernel: '5.19.17',
                    },
                    packages: {
                        openssl: '3.0.8',
                    },
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

        it('should generate complete report when API is running and all queries succeed', async () => {
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

            const result = await apiReportService.generateReport(true);

            // Verify GraphQL client was called for all queries
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

            // Verify report structure
            expect(result).toMatchObject({
                timestamp: expect.any(String),
                connectionStatus: {
                    running: 'yes',
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
                    cloud: {
                        id: 'service-cloud',
                        name: 'cloud',
                        online: true,
                        uptime: { timestamp: '2023-01-01T00:00:00Z' },
                        version: '1.0.0',
                    },
                    minigraph: {
                        id: 'service-minigraph',
                        name: 'minigraph',
                        online: false,
                        uptime: null,
                        version: '2.0.0',
                    },
                    allServices: [
                        {
                            name: 'cloud',
                            online: true,
                            version: '1.0.0',
                            uptime: '2023-01-01T00:00:00Z',
                        },
                        {
                            name: 'minigraph',
                            online: false,
                            version: '2.0.0',
                            uptime: null,
                        },
                    ],
                },
            });
        });

        it('should return error report when API is not running', async () => {
            const result = await apiReportService.generateReport(false);

            // Verify GraphQL client was not called
            expect(mockInternalClientService.getClient).not.toHaveBeenCalled();
            expect(mockClient.query).not.toHaveBeenCalled();

            // Verify error report structure
            expect(result).toMatchObject({
                timestamp: expect.any(String),
                connectionStatus: {
                    running: 'no',
                },
                system: {
                    name: 'Unknown',
                    version: 'Unknown',
                    machineId: 'REDACTED',
                },
                connect: {
                    installed: false,
                    reason: 'API is not running',
                },
                config: {
                    valid: null,
                    error: 'API is not running',
                },
                services: {
                    cloud: null,
                    minigraph: null,
                    allServices: [],
                },
            });
        });

        it('should handle connect plugin not available gracefully', async () => {
            // Mock system and services queries to succeed, connect to fail
            mockClient.query.mockImplementation(({ query }) => {
                if (query === SYSTEM_REPORT_QUERY) {
                    return Promise.resolve({ data: mockSystemData });
                } else if (query === CONNECT_STATUS_QUERY) {
                    return Promise.reject(new Error('Connect plugin not installed'));
                } else if (query === SERVICES_QUERY) {
                    return Promise.resolve({ data: mockServicesData });
                }
                return Promise.reject(new Error('Unknown query'));
            });

            const result = await apiReportService.generateReport(true);

            // Verify connect error was logged
            expect(mockLogService.debug).toHaveBeenCalledWith(
                expect.stringContaining('Connect plugin not available')
            );

            // Verify connect shows as not installed
            expect(result.connect).toEqual({
                installed: false,
                reason: 'Connect plugin not installed or not available',
            });

            // Verify other data is still present
            expect(result.system.name).toBe('Test Server');
            expect(result.services.cloud).toBeTruthy();
        });

        it('should handle services query failure gracefully', async () => {
            // Mock system and connect queries to succeed, services to fail
            mockClient.query.mockImplementation(({ query }) => {
                if (query === SYSTEM_REPORT_QUERY) {
                    return Promise.resolve({ data: mockSystemData });
                } else if (query === CONNECT_STATUS_QUERY) {
                    return Promise.resolve({ data: mockConnectData });
                } else if (query === SERVICES_QUERY) {
                    return Promise.reject(new Error('Services query failed'));
                }
                return Promise.reject(new Error('Unknown query'));
            });

            const result = await apiReportService.generateReport(true);

            // Verify services error was logged
            expect(mockLogService.debug).toHaveBeenCalledWith(
                expect.stringContaining('Error querying services')
            );

            // Verify services shows empty
            expect(result.services).toEqual({
                cloud: null,
                minigraph: null,
                allServices: [],
            });

            // Verify other data is still present
            expect(result.system.name).toBe('Test Server');
            expect(result.connect.installed).toBe(true);
        });

        it('should handle missing server name gracefully', async () => {
            const mockSystemDataWithoutServer = {
                ...mockSystemData,
                server: null,
            };

            mockClient.query.mockImplementation(({ query }) => {
                if (query === SYSTEM_REPORT_QUERY) {
                    return Promise.resolve({ data: mockSystemDataWithoutServer });
                } else if (query === CONNECT_STATUS_QUERY) {
                    return Promise.resolve({ data: mockConnectData });
                } else if (query === SERVICES_QUERY) {
                    return Promise.resolve({ data: mockServicesData });
                }
                return Promise.reject(new Error('Unknown query'));
            });

            const result = await apiReportService.generateReport(true);

            expect(result.system.name).toBe('Unknown');
        });

        it('should handle services without uptime timestamps', async () => {
            const mockServicesDataNoUptime = {
                services: [
                    {
                        id: 'service-test',
                        name: 'test-service',
                        online: true,
                        uptime: null,
                        version: '1.0.0',
                    },
                ],
            };

            mockClient.query.mockImplementation(({ query }) => {
                if (query === SYSTEM_REPORT_QUERY) {
                    return Promise.resolve({ data: mockSystemData });
                } else if (query === CONNECT_STATUS_QUERY) {
                    return Promise.resolve({ data: mockConnectData });
                } else if (query === SERVICES_QUERY) {
                    return Promise.resolve({ data: mockServicesDataNoUptime });
                }
                return Promise.reject(new Error('Unknown query'));
            });

            const result = await apiReportService.generateReport(true);

            expect(result.services.allServices[0]).toMatchObject({
                name: 'test-service',
                online: true,
                version: '1.0.0',
                uptime: null,
            });
        });

        it('should always redact sensitive information', async () => {
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

            const result = await apiReportService.generateReport(true);

            // Verify all sensitive fields are redacted
            expect(result.system.machineId).toBe('REDACTED');
        });

        it('should handle connect when dynamic remote access is disabled', async () => {
            const mockConnectDataWithDynamicRemoteAccessDisabled = {
                connect: {
                    id: 'connect',
                    dynamicRemoteAccess: {
                        enabledType: 'DISABLED',
                        runningType: 'DISABLED',
                        error: null,
                    },
                },
            };

            mockClient.query.mockImplementation(({ query }) => {
                if (query === SYSTEM_REPORT_QUERY) {
                    return Promise.resolve({ data: mockSystemData });
                } else if (query === CONNECT_STATUS_QUERY) {
                    return Promise.resolve({ data: mockConnectDataWithDynamicRemoteAccessDisabled });
                } else if (query === SERVICES_QUERY) {
                    return Promise.resolve({ data: mockServicesData });
                }
                return Promise.reject(new Error('Unknown query'));
            });

            const result = await apiReportService.generateReport(true);

            expect(result.connect).toMatchObject({
                installed: true,
                dynamicRemoteAccess: {
                    enabledType: 'DISABLED',
                    runningType: 'DISABLED',
                    error: null,
                },
            });
        });
    });
});
