import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ApolloClient } from '@apollo/client/core/index.js';

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

// Mock factory similar to InternalGraphQLClientFactory
class MockGraphQLClientFactory {
    constructor(
        private readonly configService: ConfigService,
        private readonly socketConfig: SocketConfigService
    ) {}

    async createClient(options: {
        apiKey: string;
        enableSubscriptions?: boolean;
        origin?: string;
    }): Promise<ApolloClient<any>> {
        if (!options.apiKey) {
            throw new Error('API key is required for creating a GraphQL client');
        }
        
        // Return a mock Apollo client
        const mockClient = {
            query: vi.fn(),
            mutate: vi.fn(),
            stop: vi.fn(),
            subscribe: vi.fn(),
            watchQuery: vi.fn(),
            readQuery: vi.fn(),
            writeQuery: vi.fn(),
            cache: {
                reset: vi.fn(),
            },
        } as any;
        
        return mockClient;
    }
}

// Service that uses the factory pattern (like CliInternalClientService)
class ClientConsumerService {
    private client: ApolloClient<any> | null = null;
    private wsClient: any = null;

    constructor(
        private readonly factory: MockGraphQLClientFactory,
        private readonly apiKeyProvider: () => Promise<string>,
        private readonly options: { enableSubscriptions?: boolean; origin?: string } = {}
    ) {
        // Use default origin if not provided
        if (!this.options.origin) {
            this.options.origin = 'http://localhost';
        }
    }

    async getClient(): Promise<ApolloClient<any>> {
        if (this.client) {
            return this.client;
        }
        
        const apiKey = await this.apiKeyProvider();
        this.client = await this.factory.createClient({
            apiKey,
            ...this.options,
        });
        
        return this.client;
    }

    clearClient() {
        // Stop the Apollo client to terminate any active processes
        this.client?.stop();
        // Clean up WebSocket client if it exists
        if (this.wsClient) {
            this.wsClient.dispose();
            this.wsClient = null;
        }
        this.client = null;
    }
}

describe('InternalGraphQLClient Usage Patterns', () => {
    let factory: MockGraphQLClientFactory;
    let configService: ConfigService;
    let socketConfig: SocketConfigService;
    let apiKeyProvider: () => Promise<string>;
    let service: ClientConsumerService;

    beforeEach(() => {
        // Create mock ConfigService
        configService = {
            get: vi.fn((key, defaultValue) => {
                if (key === 'PORT') return '3001';
                return defaultValue;
            }),
        } as any;

        // Create SocketConfigService instance
        socketConfig = new SocketConfigService(configService);

        // Create factory
        factory = new MockGraphQLClientFactory(configService, socketConfig);

        // Create mock API key provider
        apiKeyProvider = vi.fn().mockResolvedValue('test-api-key');

        // Create service
        service = new ClientConsumerService(factory, apiKeyProvider);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor and initialization', () => {
        it('should initialize with default options', () => {
            const service = new ClientConsumerService(factory, apiKeyProvider);
            expect(service).toBeDefined();
            // @ts-ignore - accessing private property for testing
            expect(service.options.origin).toBe('http://localhost');
        });

        it('should initialize with custom options', () => {
            const options = {
                enableSubscriptions: true,
                origin: 'custom-origin',
            };
            const service = new ClientConsumerService(factory, apiKeyProvider, options);
            
            // @ts-ignore - accessing private property for testing
            expect(service.options.enableSubscriptions).toBe(true);
            // @ts-ignore - accessing private property for testing
            expect(service.options.origin).toBe('custom-origin');
        });
    });

    describe('API key handling', () => {
        it('should get API key from provider', async () => {
            const client = await service.getClient();
            expect(apiKeyProvider).toHaveBeenCalled();
            expect(client).toBeDefined();
        });

        it('should handle API key provider failures gracefully', async () => {
            const failingProvider = vi.fn().mockRejectedValue(new Error('API key error'));
            const service = new ClientConsumerService(factory, failingProvider);
            
            await expect(service.getClient()).rejects.toThrow('API key error');
        });
    });

    describe('client lifecycle management', () => {
        it('should create and cache client on first call', async () => {
            const client = await service.getClient();
            expect(client).toBeDefined();
            expect(client.query).toBeDefined();
            expect(apiKeyProvider).toHaveBeenCalledOnce();
            
            // Second call should return cached client
            const client2 = await service.getClient();
            expect(client2).toBe(client);
            expect(apiKeyProvider).toHaveBeenCalledOnce(); // Still only called once
        });

        it('should clear cached client and stop it', async () => {
            const client = await service.getClient();
            const stopSpy = vi.spyOn(client, 'stop');
            
            service.clearClient();
            
            expect(stopSpy).toHaveBeenCalled();
            // @ts-ignore - accessing private property for testing
            expect(service.client).toBeNull();
        });

        it('should handle clearing when no client exists', () => {
            expect(() => service.clearClient()).not.toThrow();
        });

        it('should create new client after clearing', async () => {
            const client1 = await service.getClient();
            service.clearClient();
            
            const client2 = await service.getClient();
            expect(client2).not.toBe(client1);
            expect(apiKeyProvider).toHaveBeenCalledTimes(2);
        });
    });

    describe('configuration scenarios', () => {
        it('should handle Unix socket configuration', async () => {
            vi.mocked(configService.get).mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return '/var/run/unraid-api.sock';
                return defaultValue;
            });
            
            const socketConfig = new SocketConfigService(configService);
            const factory = new MockGraphQLClientFactory(configService, socketConfig);
            const service = new ClientConsumerService(factory, apiKeyProvider);
            
            const client = await service.getClient();
            expect(client).toBeDefined();
            expect(apiKeyProvider).toHaveBeenCalled();
        });

        it('should handle TCP port configuration', async () => {
            vi.mocked(configService.get).mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return '3001';
                return defaultValue;
            });
            
            const client = await service.getClient();
            expect(client).toBeDefined();
            expect(apiKeyProvider).toHaveBeenCalled();
        });

        it('should handle WebSocket subscriptions when enabled', async () => {
            const options = { enableSubscriptions: true };
            const service = new ClientConsumerService(factory, apiKeyProvider, options);
            
            const client = await service.getClient();
            expect(client).toBeDefined();
            expect(client.subscribe).toBeDefined();
        });
    });

    describe('factory pattern benefits', () => {
        it('should allow multiple services to use the same factory', async () => {
            const service1 = new ClientConsumerService(factory, apiKeyProvider, {
                origin: 'service1',
            });
            const service2 = new ClientConsumerService(factory, apiKeyProvider, {
                origin: 'service2',
            });
            
            const client1 = await service1.getClient();
            const client2 = await service2.getClient();
            
            expect(client1).toBeDefined();
            expect(client2).toBeDefined();
            // Each service gets its own client instance
            expect(client1).not.toBe(client2);
        });

        it('should handle different API keys for different services', async () => {
            const provider1 = vi.fn().mockResolvedValue('api-key-1');
            const provider2 = vi.fn().mockResolvedValue('api-key-2');
            
            const service1 = new ClientConsumerService(factory, provider1);
            const service2 = new ClientConsumerService(factory, provider2);
            
            await service1.getClient();
            await service2.getClient();
            
            expect(provider1).toHaveBeenCalledOnce();
            expect(provider2).toHaveBeenCalledOnce();
        });
    });

    describe('integration scenarios', () => {
        it('should handle production scenario with Unix socket and subscriptions', async () => {
            vi.mocked(configService.get).mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return '/var/run/unraid-api.sock';
                if (key === 'store.emhttp.nginx.httpPort') return '80';
                return defaultValue;
            });
            
            const socketConfig = new SocketConfigService(configService);
            const factory = new MockGraphQLClientFactory(configService, socketConfig);
            const service = new ClientConsumerService(factory, apiKeyProvider, {
                enableSubscriptions: true,
            });
            
            const client = await service.getClient();
            expect(client).toBeDefined();
        });

        it('should handle development scenario with TCP port and subscriptions', async () => {
            vi.mocked(configService.get).mockImplementation((key, defaultValue) => {
                if (key === 'PORT') return '3001';
                return defaultValue;
            });
            
            const socketConfig = new SocketConfigService(configService);
            const factory = new MockGraphQLClientFactory(configService, socketConfig);
            const service = new ClientConsumerService(factory, apiKeyProvider, {
                enableSubscriptions: true,
            });
            
            const client = await service.getClient();
            expect(client).toBeDefined();
        });

        it('should handle multiple client lifecycle operations', async () => {
            const client1 = await service.getClient();
            expect(client1).toBeDefined();
            
            service.clearClient();
            
            const client2 = await service.getClient();
            expect(client2).toBeDefined();
            expect(client2).not.toBe(client1);
            
            service.clearClient();
            
            const client3 = await service.getClient();
            expect(client3).toBeDefined();
            expect(client3).not.toBe(client2);
        });

        it('should handle WebSocket client cleanup when subscriptions are enabled', async () => {
            const mockWsClient = { dispose: vi.fn() };
            const service = new ClientConsumerService(factory, apiKeyProvider, {
                enableSubscriptions: true,
            });
            
            // First create a client
            await service.getClient();
            
            // Mock the WebSocket client after it's created
            // @ts-ignore - accessing private property for testing
            service.wsClient = mockWsClient;
            
            service.clearClient();
            
            expect(mockWsClient.dispose).toHaveBeenCalled();
        });
    });
});