import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ApolloClient } from '@apollo/client/core/index.js';

import { BaseInternalClientService, ApiKeyProvider, InternalClientOptions } from './base-internal-client.service.js';
import { SocketConfigService } from './socket-config.service.js';

// Mock graphql-ws
vi.mock('graphql-ws', () => ({
    createClient: vi.fn(() => ({
        dispose: vi.fn(),
        on: vi.fn(),
        subscribe: vi.fn(),
    })),
}));

// Mock undici
vi.mock('undici', () => ({
    Agent: vi.fn(() => ({
        connect: { socketPath: '/test/socket.sock' },
    })),
    fetch: vi.fn(() => Promise.resolve({ ok: true })),
}));

// Concrete implementation for testing
class TestInternalClientService extends BaseInternalClientService {
    constructor(
        configService: ConfigService,
        apiKeyProvider: ApiKeyProvider,
        socketConfig: SocketConfigService,
        options?: InternalClientOptions
    ) {
        super(configService, apiKeyProvider, socketConfig, options);
    }
}

describe('BaseInternalClientService', () => {
    let service: TestInternalClientService;
    let configService: ConfigService;
    let apiKeyProvider: ApiKeyProvider;
    let socketConfig: SocketConfigService;
    let mockApolloClient: any;

    beforeEach(() => {
        // Create mock ConfigService
        configService = {
            get: vi.fn((key, defaultValue) => {
                if (key === 'PORT') return '3001';
                return defaultValue;
            }),
        } as any;

        // Create mock ApiKeyProvider
        apiKeyProvider = {
            getOrCreateLocalApiKey: vi.fn().mockResolvedValue('test-api-key'),
        };

        // Create SocketConfigService instance
        socketConfig = new SocketConfigService(configService);

        mockApolloClient = {
            query: vi.fn(),
            mutate: vi.fn(),
            stop: vi.fn(),
        };

        service = new TestInternalClientService(configService, apiKeyProvider, socketConfig);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default options', () => {
            const service = new TestInternalClientService(configService, apiKeyProvider, socketConfig);
            expect(service).toBeDefined();
            // @ts-ignore - accessing protected property for testing
            expect(service.options.origin).toBe('http://localhost');
        });

        it('should initialize with custom options', () => {
            const options = {
                enableSubscriptions: true,
                origin: 'custom-origin',
            };
            const service = new TestInternalClientService(configService, apiKeyProvider, socketConfig, options);
            
            // @ts-ignore - accessing protected property for testing
            expect(service.options.enableSubscriptions).toBe(true);
            // @ts-ignore - accessing protected property for testing
            expect(service.options.origin).toBe('custom-origin');
        });

        it('should use injected SocketConfigService instance', () => {
            const service = new TestInternalClientService(configService, apiKeyProvider, socketConfig);
            // @ts-ignore - accessing protected property for testing
            expect(service.socketConfig).toBeDefined();
            // @ts-ignore - accessing protected property for testing
            expect(service.socketConfig).toBe(socketConfig);
        });
    });

    describe('getClient', () => {
        it('should create and cache client on first call', async () => {
            const client = await service.getClient();
            
            expect(client).toBeInstanceOf(ApolloClient);
            expect(apiKeyProvider.getOrCreateLocalApiKey).toHaveBeenCalledOnce();
            
            // Verify it's cached
            const client2 = await service.getClient();
            expect(client2).toBe(client);
            expect(apiKeyProvider.getOrCreateLocalApiKey).toHaveBeenCalledOnce();
        });

        it('should handle API key retrieval errors', async () => {
            vi.mocked(apiKeyProvider.getOrCreateLocalApiKey).mockRejectedValueOnce(
                new Error('API key error')
            );
            
            await expect(service.getClient()).rejects.toThrow(
                'Unable to get API key for internal client'
            );
        });

        it('should create client with Unix socket when configured', async () => {
            vi.mocked(configService.get).mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return '/var/run/unraid-api.sock';
                return defaultValue;
            });
            
            const socketConfig = new SocketConfigService(configService);
            const service = new TestInternalClientService(configService, apiKeyProvider, socketConfig);
            const client = await service.getClient();
            
            expect(client).toBeInstanceOf(ApolloClient);
            expect(apiKeyProvider.getOrCreateLocalApiKey).toHaveBeenCalled();
        });

        it('should create client with HTTP when using TCP port', async () => {
            vi.mocked(configService.get).mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return '3001';
                return defaultValue;
            });
            
            const client = await service.getClient();
            
            expect(client).toBeInstanceOf(ApolloClient);
            expect(apiKeyProvider.getOrCreateLocalApiKey).toHaveBeenCalled();
        });

        it('should create client with WebSocket subscriptions when enabled', async () => {
            const options = { enableSubscriptions: true };
            const service = new TestInternalClientService(configService, apiKeyProvider, socketConfig, options);
            
            const client = await service.getClient();
            
            expect(client).toBeInstanceOf(ApolloClient);
        });
    });

    describe('clearClient', () => {
        it('should stop and clear the cached client', async () => {
            // First create a client
            const client = await service.getClient();
            const stopSpy = vi.spyOn(client, 'stop');
            
            // Clear the client
            service.clearClient();
            
            expect(stopSpy).toHaveBeenCalled();
            
            // Verify a new client is created on next call
            const newClient = await service.getClient();
            expect(newClient).not.toBe(client);
            expect(apiKeyProvider.getOrCreateLocalApiKey).toHaveBeenCalledTimes(2);
        });

        it('should handle clearing when no client exists', () => {
            // Should not throw when no client exists
            expect(() => service.clearClient()).not.toThrow();
        });

        it('should dispose WebSocket client when subscriptions are enabled', async () => {
            const options = { enableSubscriptions: true };
            const service = new TestInternalClientService(configService, apiKeyProvider, socketConfig, options);
            
            // First create a client to initialize the WebSocket client
            await service.getClient();
            
            // Mock the WebSocket client after it's created
            const mockWsClient = { dispose: vi.fn() };
            // @ts-ignore - accessing private property for testing
            service.wsClient = mockWsClient;
            
            service.clearClient();
            
            expect(mockWsClient.dispose).toHaveBeenCalled();
        });
    });

    describe('integration scenarios', () => {
        it('should handle production scenario with Unix socket', async () => {
            vi.mocked(configService.get).mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return '/var/run/unraid-api.sock';
                if (key === 'store.emhttp.nginx.httpPort') return '80';
                return defaultValue;
            });
            
            const socketConfig = new SocketConfigService(configService);
            const service = new TestInternalClientService(configService, apiKeyProvider, socketConfig, {
                enableSubscriptions: true,
            });
            
            const client = await service.getClient();
            expect(client).toBeInstanceOf(ApolloClient);
        });

        it('should handle development scenario with TCP port', async () => {
            vi.mocked(configService.get).mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return '3001';
                return defaultValue;
            });
            
            const socketConfig = new SocketConfigService(configService);
            const service = new TestInternalClientService(configService, apiKeyProvider, socketConfig, {
                enableSubscriptions: true,
            });
            
            const client = await service.getClient();
            expect(client).toBeInstanceOf(ApolloClient);
        });

        it('should handle multiple client lifecycle operations', async () => {
            const client1 = await service.getClient();
            expect(client1).toBeInstanceOf(ApolloClient);
            
            service.clearClient();
            
            const client2 = await service.getClient();
            expect(client2).toBeInstanceOf(ApolloClient);
            expect(client2).not.toBe(client1);
            
            service.clearClient();
            
            const client3 = await service.getClient();
            expect(client3).toBeInstanceOf(ApolloClient);
            expect(client3).not.toBe(client2);
        });
    });
});