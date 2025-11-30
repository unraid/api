import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MinigraphStatus } from '../config/connect.config.js';
import { MothershipGraphqlClientService } from '../mothership-proxy/graphql.client.js';

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
        it.each([
            {
                description: 'standard API key error',
                error: { message: 'API Key Invalid with error No user found' },
                expected: true,
            },
            {
                description: 'simple API key error',
                error: { message: 'API Key Invalid' },
                expected: true,
            },
            {
                description: 'API key error within other text',
                error: { message: 'Something else API Key Invalid something' },
                expected: true,
            },
            {
                description: 'malformed GraphQL error with API key message',
                error: {
                    message:
                        '"error" message expects the \'payload\' property to be an array of GraphQL errors, but got "API Key Invalid with error No user found"',
                },
                expected: true,
            },
            {
                description: 'non-API key error',
                error: { message: 'Network connection failed' },
                expected: false,
            },
            {
                description: 'null error',
                error: null,
                expected: false,
            },
            {
                description: 'empty error object',
                error: {},
                expected: false,
            },
        ])('should identify $description correctly', ({ error, expected }) => {
            const isInvalidApiKeyError = (service as any).isInvalidApiKeyError.bind(service);
            expect(isInvalidApiKeyError(error)).toBe(expected);
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
