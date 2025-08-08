import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { InternalClientService } from './internal.client.js';

describe('InternalClientService', () => {
    let service: InternalClientService;
    let clientFactory: any;
    let apiKeyService: any;

    const mockApolloClient = {
        query: vi.fn(),
        mutate: vi.fn(),
        stop: vi.fn(),
    };

    beforeEach(() => {
        clientFactory = {
            createClient: vi.fn().mockResolvedValue(mockApolloClient),
        };

        apiKeyService = {
            getOrCreateLocalApiKey: vi.fn().mockResolvedValue('test-connect-key'),
        };

        service = new InternalClientService(
            clientFactory as any,
            apiKeyService as any
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getClient', () => {
        it('should create a client with Connect API key and subscriptions', async () => {
            const client = await service.getClient();

            expect(apiKeyService.getOrCreateLocalApiKey).toHaveBeenCalled();
            expect(clientFactory.createClient).toHaveBeenCalledWith({
                apiKey: 'test-connect-key',
                enableSubscriptions: true,
            });
            expect(client).toBe(mockApolloClient);
        });

        it('should return cached client on subsequent calls', async () => {
            const client1 = await service.getClient();
            const client2 = await service.getClient();

            expect(client1).toBe(client2);
            expect(clientFactory.createClient).toHaveBeenCalledTimes(1);
        });

        it('should handle concurrent calls correctly', async () => {
            // Create a delayed mock to simulate async client creation
            let resolveClientCreation: (value: any) => void;
            const clientCreationPromise = new Promise((resolve) => {
                resolveClientCreation = resolve;
            });

            vi.mocked(clientFactory.createClient).mockReturnValueOnce(clientCreationPromise);

            // Start multiple concurrent calls
            const promise1 = service.getClient();
            const promise2 = service.getClient();
            const promise3 = service.getClient();

            // Resolve the client creation
            resolveClientCreation!(mockApolloClient);

            // Wait for all promises to resolve
            const [client1, client2, client3] = await Promise.all([promise1, promise2, promise3]);

            // All should return the same client
            expect(client1).toBe(mockApolloClient);
            expect(client2).toBe(mockApolloClient);
            expect(client3).toBe(mockApolloClient);

            // createClient should only have been called once
            expect(clientFactory.createClient).toHaveBeenCalledTimes(1);
        });

        it('should handle errors during client creation', async () => {
            const error = new Error('Failed to create client');
            vi.mocked(clientFactory.createClient).mockRejectedValueOnce(error);

            await expect(service.getClient()).rejects.toThrow('Failed to create client');

            // The in-flight promise should be cleared after error
            // A subsequent call should attempt creation again
            vi.mocked(clientFactory.createClient).mockResolvedValueOnce(mockApolloClient);
            const client = await service.getClient();
            expect(client).toBe(mockApolloClient);
            expect(clientFactory.createClient).toHaveBeenCalledTimes(2);
        });
    });

    describe('clearClient', () => {
        it('should stop and clear the client', async () => {
            // First create a client
            await service.getClient();

            // Clear the client
            service.clearClient();

            expect(mockApolloClient.stop).toHaveBeenCalled();
        });

        it('should handle clearing when no client exists', () => {
            // Should not throw when clearing a non-existent client
            expect(() => service.clearClient()).not.toThrow();
        });

        it('should create a new client after clearing', async () => {
            // Create initial client
            await service.getClient();

            // Clear it
            service.clearClient();

            // Reset mock to return a new client
            const newMockClient = { 
                query: vi.fn(),
                mutate: vi.fn(),
                stop: vi.fn(),
            };
            vi.mocked(clientFactory.createClient).mockResolvedValueOnce(newMockClient);

            // Create new client
            const newClient = await service.getClient();

            // Should have created client twice total
            expect(clientFactory.createClient).toHaveBeenCalledTimes(2);
            expect(newClient).toBe(newMockClient);
        });

        it('should clear in-flight promise when clearing client', async () => {
            // Create a delayed mock to simulate async client creation
            let resolveClientCreation: (value: any) => void;
            const clientCreationPromise = new Promise((resolve) => {
                resolveClientCreation = resolve;
            });

            vi.mocked(clientFactory.createClient).mockReturnValueOnce(clientCreationPromise);

            // Start client creation
            const promise1 = service.getClient();

            // Clear client while creation is in progress
            service.clearClient();

            // Resolve the original creation
            resolveClientCreation!(mockApolloClient);
            await promise1;

            // Reset mock for new client
            const newMockClient = { 
                query: vi.fn(),
                mutate: vi.fn(),
                stop: vi.fn(),
            };
            vi.mocked(clientFactory.createClient).mockResolvedValueOnce(newMockClient);

            // Try to get client again - should create a new one
            const client = await service.getClient();
            expect(client).toBe(newMockClient);
            expect(clientFactory.createClient).toHaveBeenCalledTimes(2);
        });

        it('should handle clearClient during creation followed by new getClient call', async () => {
            // Create two delayed mocks to simulate async client creation
            let resolveFirstCreation: (value: any) => void;
            let resolveSecondCreation: (value: any) => void;
            
            const firstCreationPromise = new Promise((resolve) => {
                resolveFirstCreation = resolve;
            });
            const secondCreationPromise = new Promise((resolve) => {
                resolveSecondCreation = resolve;
            });

            const firstMockClient = { 
                query: vi.fn(),
                mutate: vi.fn(),
                stop: vi.fn(),
            };
            const secondMockClient = { 
                query: vi.fn(),
                mutate: vi.fn(),
                stop: vi.fn(),
            };

            vi.mocked(clientFactory.createClient)
                .mockReturnValueOnce(firstCreationPromise)
                .mockReturnValueOnce(secondCreationPromise);

            // Thread A: Start first client creation
            const promiseA = service.getClient();

            // Thread B: Clear client while first creation is in progress
            service.clearClient();

            // Thread C: Start second client creation
            const promiseC = service.getClient();

            // Resolve first creation (should not set client)
            resolveFirstCreation!(firstMockClient);
            const clientA = await promiseA;

            // Resolve second creation (should set client)
            resolveSecondCreation!(secondMockClient);
            const clientC = await promiseC;

            // Both should return their respective clients
            expect(clientA).toBe(firstMockClient);
            expect(clientC).toBe(secondMockClient);

            // But only the second client should be cached
            const cachedClient = await service.getClient();
            expect(cachedClient).toBe(secondMockClient);

            // Should have created exactly 2 clients
            expect(clientFactory.createClient).toHaveBeenCalledTimes(2);
        });

        it('should handle rapid clear and get cycles correctly', async () => {
            // Test rapid clear/get cycles
            const clients: any[] = [];
            for (let i = 0; i < 3; i++) {
                const mockClient = {
                    query: vi.fn(),
                    mutate: vi.fn(),
                    stop: vi.fn(),
                };
                clients.push(mockClient);
                vi.mocked(clientFactory.createClient).mockResolvedValueOnce(mockClient);
            }

            // Cycle 1: Create and immediately clear
            const promise1 = service.getClient();
            service.clearClient();
            const client1 = await promise1;
            expect(client1).toBe(clients[0]);

            // Cycle 2: Create and immediately clear
            const promise2 = service.getClient();
            service.clearClient();
            const client2 = await promise2;
            expect(client2).toBe(clients[1]);

            // Cycle 3: Create and let it complete
            const client3 = await service.getClient();
            expect(client3).toBe(clients[2]);

            // Verify the third client is cached
            const cachedClient = await service.getClient();
            expect(cachedClient).toBe(clients[2]);

            // Should have created exactly 3 clients
            expect(clientFactory.createClient).toHaveBeenCalledTimes(3);
        });
    });
});