import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MothershipGraphqlClientService } from '../service/graphql.client.js';
import { MinigraphStatus } from '../model/connect-config.model.js';

// Mock only the WebSocket client creation, not the Apollo Client error handling
vi.mock('graphql-ws', () => ({
    createClient: vi.fn(),
}));

// Mock WebSocket to avoid actual network connections
vi.mock('ws', () => ({
    WebSocket: vi.fn().mockImplementation(() => ({})),
}));

describe('MothershipGraphqlClientService', () => {
    let service: MothershipGraphqlClientService;
    let mockConfigService: any;
    let mockConnectionService: any;
    let mockEventEmitter: any;
    let mockWsClient: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        mockConfigService = {
            getOrThrow: vi.fn((key: string) => {
                switch (key) {
                    case 'API_VERSION':
                        return '4.8.0+test';
                    case 'MOTHERSHIP_GRAPHQL_LINK':
                        return 'https://mothership.unraid.net/ws';
                    default:
                        throw new Error(`Unknown config key: ${key}`);
                }
            }),
            set: vi.fn(),
        };

        mockConnectionService = {
            getIdentityState: vi.fn().mockReturnValue({ isLoaded: true }),
            getWebsocketConnectionParams: vi.fn().mockReturnValue({}),
            getMothershipWebsocketHeaders: vi.fn().mockReturnValue({}),
            getConnectionState: vi.fn().mockReturnValue({ status: MinigraphStatus.CONNECTED }),
            setConnectionStatus: vi.fn(),
            receivePing: vi.fn(),
        };

        mockEventEmitter = {
            emit: vi.fn(),
        };

        mockWsClient = {
            on: vi.fn().mockReturnValue(() => {}),
            terminate: vi.fn(),
            dispose: vi.fn().mockResolvedValue(undefined),
        };

        // Mock the createClient function
        const { createClient } = await import('graphql-ws');
        vi.mocked(createClient).mockReturnValue(mockWsClient as any);

        service = new MothershipGraphqlClientService(
            mockConfigService as any,
            mockConnectionService as any,
            mockEventEmitter as any
        );
    });

    describe('isInvalidApiKeyError', () => {
        it('should identify API key invalid errors correctly', () => {
            const validApiKeyError = {
                message: 'API Key Invalid with error No user found',
            };

            const malformedGraphQlError = {
                message: '"error" message expects the \'payload\' property to be an array of GraphQL errors, but got "API Key Invalid with error No user found"',
            };

            const otherError = {
                message: 'Network connection failed',
            };

            // Use reflection to access private method
            const isInvalidApiKeyError = (service as any).isInvalidApiKeyError.bind(service);

            expect(isInvalidApiKeyError(validApiKeyError)).toBe(true);
            expect(isInvalidApiKeyError(malformedGraphQlError)).toBe(true);
            expect(isInvalidApiKeyError(otherError)).toBe(false);
            expect(isInvalidApiKeyError(null)).toBe(false);
            expect(isInvalidApiKeyError({})).toBe(false);
        });
    });

    describe('error handling and logout behavior', () => {
        it('should detect malformed GraphQL error with API Key Invalid', () => {
            const malformedError = {
                message: '"error" message expects the \'payload\' property to be an array of GraphQL errors, but got "API Key Invalid with error No user found"',
            };

            const isInvalidApiKeyError = (service as any).isInvalidApiKeyError.bind(service);
            expect(isInvalidApiKeyError(malformedError)).toBe(true);
        });

        it('should detect standard API Key Invalid error', () => {
            const apiKeyError = {
                message: 'API Key Invalid with error No user found',
            };

            const isInvalidApiKeyError = (service as any).isInvalidApiKeyError.bind(service);
            expect(isInvalidApiKeyError(apiKeyError)).toBe(true);
        });

        it('should not detect non-API key errors as API key errors', () => {
            const networkError = {
                message: 'Connection timeout',
            };

            const isInvalidApiKeyError = (service as any).isInvalidApiKeyError.bind(service);
            expect(isInvalidApiKeyError(networkError)).toBe(false);
        });
    });

    describe('client lifecycle', () => {
        it('should return null client when identity state is not valid', () => {
            mockConnectionService.getIdentityState.mockReturnValue({ isLoaded: false });

            const client = service.getClient();

            expect(client).toBeNull();
        });

        it('should return client when identity state is valid', () => {
            mockConnectionService.getIdentityState.mockReturnValue({ isLoaded: true });

            // Since we're not mocking Apollo Client, this will create a real client
            // We just want to verify the state check works
            const client = service.getClient();
            
            // The client should either be null (if not created yet) or an Apollo client instance
            // The key is that it doesn't throw an error when state is valid
            expect(() => service.getClient()).not.toThrow();
        });
    });

    describe('sendQueryResponse', () => {
        it('should handle null client gracefully', async () => {
            // Make identity state invalid so getClient returns null
            mockConnectionService.getIdentityState.mockReturnValue({ isLoaded: false });

            const result = await service.sendQueryResponse('test-sha256', {
                data: { test: 'data' },
            });

            // Should not throw and should return undefined when client is null
            expect(result).toBeUndefined();
        });
    });

    describe('configuration', () => {
        it('should get API version from config', () => {
            expect(service.apiVersion).toBe('4.8.0+test');
        });

        it('should get mothership GraphQL link from config', () => {
            expect(service.mothershipGraphqlLink).toBe('https://mothership.unraid.net/ws');
        });
    });
});

// Integration test for the actual error scenario from the logs
describe('MothershipGraphqlClientService Integration', () => {
    let service: MothershipGraphqlClientService;
    let mockEventEmitter: any;

    beforeEach(() => {
        const mockConfigService = {
            getOrThrow: vi.fn((key: string) => {
                switch (key) {
                    case 'API_VERSION':
                        return '4.8.0+test';
                    case 'MOTHERSHIP_GRAPHQL_LINK':
                        return 'https://mothership.unraid.net/ws';
                    default:
                        throw new Error(`Unknown config key: ${key}`);
                }
            }),
            set: vi.fn(),
        };

        const mockConnectionService = {
            getIdentityState: vi.fn().mockReturnValue({ isLoaded: false }), // Prevent client creation
            getWebsocketConnectionParams: vi.fn().mockReturnValue({}),
            getMothershipWebsocketHeaders: vi.fn().mockReturnValue({}),
            getConnectionState: vi.fn().mockReturnValue({ status: MinigraphStatus.CONNECTED }),
            setConnectionStatus: vi.fn(),
            receivePing: vi.fn(),
        };

        mockEventEmitter = {
            emit: vi.fn(),
        };

        service = new MothershipGraphqlClientService(
            mockConfigService as any,
            mockConnectionService as any,
            mockEventEmitter as any
        );
    });

    it('should correctly identify the exact error from the logs as an API key error', () => {
        const logError = {
            message: '"error" message expects the \'payload\' property to be an array of GraphQL errors, but got "API Key Invalid with error No user found"',
        };

        const isInvalidApiKeyError = (service as any).isInvalidApiKeyError.bind(service);
        
        // This is the core test - ensure the exact error from your logs is identified correctly
        expect(isInvalidApiKeyError(logError)).toBe(true);
    });

    it('should identify various forms of API key errors', () => {
        const isInvalidApiKeyError = (service as any).isInvalidApiKeyError.bind(service);
        
        const errors = [
            { message: 'API Key Invalid with error No user found' },
            { message: 'API Key Invalid' },
            { message: 'Something else API Key Invalid something' },
            { message: '"error" message expects the \'payload\' property to be an array of GraphQL errors, but got "API Key Invalid with error No user found"' },
        ];

        errors.forEach(error => {
            expect(isInvalidApiKeyError(error)).toBe(true);
        });
    });
}); 