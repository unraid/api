import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import type { InternalGraphQLClientFactory } from '@unraid/shared';
import { ApolloClient } from '@apollo/client/core/index.js';
import { INTERNAL_CLIENT_SERVICE_TOKEN } from '@unraid/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminKeyService } from '@app/unraid-api/cli/admin-key.service.js';
import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';

describe('CliInternalClientService', () => {
    let service: CliInternalClientService;
    let clientFactory: InternalGraphQLClientFactory;
    let adminKeyService: AdminKeyService;
    let module: TestingModule;

    const mockApolloClient = {
        query: vi.fn(),
        mutate: vi.fn(),
        stop: vi.fn(),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigModule.forRoot()],
            providers: [
                CliInternalClientService,
                {
                    provide: INTERNAL_CLIENT_SERVICE_TOKEN,
                    useValue: {
                        createClient: vi.fn().mockResolvedValue(mockApolloClient),
                    },
                },
                {
                    provide: AdminKeyService,
                    useValue: {
                        getOrCreateLocalAdminKey: vi.fn().mockResolvedValue('test-admin-key'),
                    },
                },
            ],
        }).compile();

        service = module.get<CliInternalClientService>(CliInternalClientService);
        clientFactory = module.get<InternalGraphQLClientFactory>(INTERNAL_CLIENT_SERVICE_TOKEN);
        adminKeyService = module.get<AdminKeyService>(AdminKeyService);
    });

    afterEach(async () => {
        await module?.close();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('dependency injection', () => {
        it('should have InternalGraphQLClientFactory injected', () => {
            expect(clientFactory).toBeDefined();
            expect(clientFactory.createClient).toBeDefined();
        });

        it('should have AdminKeyService injected', () => {
            expect(adminKeyService).toBeDefined();
            expect(adminKeyService.getOrCreateLocalAdminKey).toBeDefined();
        });
    });

    describe('getClient', () => {
        it('should create a client with getApiKey function', async () => {
            const client = await service.getClient();

            // The API key is now fetched lazily, not immediately
            expect(clientFactory.createClient).toHaveBeenCalledWith({
                getApiKey: expect.any(Function),
                enableSubscriptions: false,
            });

            // Verify the getApiKey function works correctly when called
            const callArgs = vi.mocked(clientFactory.createClient).mock.calls[0][0];
            const apiKey = await callArgs.getApiKey();
            expect(apiKey).toBe('test-admin-key');
            expect(adminKeyService.getOrCreateLocalAdminKey).toHaveBeenCalled();

            expect(client).toBe(mockApolloClient);
        });

        it('should return cached client on subsequent calls', async () => {
            const client1 = await service.getClient();
            const client2 = await service.getClient();

            expect(client1).toBe(client2);
            expect(clientFactory.createClient).toHaveBeenCalledTimes(1);
        });

        it('should handle errors when getting admin key', async () => {
            const error = new Error('Failed to get admin key');
            vi.mocked(adminKeyService.getOrCreateLocalAdminKey).mockRejectedValueOnce(error);

            // The client creation will succeed, but the API key error happens later
            const client = await service.getClient();
            expect(client).toBe(mockApolloClient);

            // Now test that the getApiKey function throws the expected error
            const callArgs = vi.mocked(clientFactory.createClient).mock.calls[0][0];
            await expect(callArgs.getApiKey()).rejects.toThrow();
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

            // Create new client
            await service.getClient();

            // Should have created client twice
            expect(clientFactory.createClient).toHaveBeenCalledTimes(2);
        });
    });

    describe('race condition protection', () => {
        it('should prevent stale client resurrection when clearClient() is called during creation', async () => {
            let resolveClientCreation!: (client: any) => void;

            // Mock createClient to return a controllable promise
            const clientCreationPromise = new Promise<any>((resolve) => {
                resolveClientCreation = resolve;
            });
            vi.mocked(clientFactory.createClient).mockReturnValueOnce(clientCreationPromise);

            // Start client creation (but don't await yet)
            const getClientPromise = service.getClient();

            // Clear the client while creation is in progress
            service.clearClient();

            // Now complete the client creation
            resolveClientCreation(mockApolloClient);

            // Wait for getClient to complete
            const client = await getClientPromise;

            // The client should be returned from getClient
            expect(client).toBe(mockApolloClient);

            // But subsequent getClient calls should create a new client
            // because the race condition protection prevented assignment
            await service.getClient();

            // Should have created a second client, proving the first wasn't assigned
            expect(clientFactory.createClient).toHaveBeenCalledTimes(2);
        });

        it('should handle concurrent getClient calls during race condition', async () => {
            let resolveClientCreation!: (client: any) => void;

            // Mock createClient to return a controllable promise
            const clientCreationPromise = new Promise<any>((resolve) => {
                resolveClientCreation = resolve;
            });
            vi.mocked(clientFactory.createClient).mockReturnValueOnce(clientCreationPromise);

            // Start multiple concurrent client creation calls
            const getClientPromise1 = service.getClient();
            const getClientPromise2 = service.getClient(); // Should wait for first one

            // Clear the client while creation is in progress
            service.clearClient();

            // Complete the client creation
            resolveClientCreation(mockApolloClient);

            // Both calls should resolve with the same client
            const [client1, client2] = await Promise.all([getClientPromise1, getClientPromise2]);
            expect(client1).toBe(mockApolloClient);
            expect(client2).toBe(mockApolloClient);

            // But the client should not be cached due to race condition protection
            await service.getClient();
            expect(clientFactory.createClient).toHaveBeenCalledTimes(2);
        });
    });
});
