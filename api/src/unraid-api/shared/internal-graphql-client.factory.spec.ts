import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { ApolloClient } from '@apollo/client/core/index.js';
import { SocketConfigService } from '@unraid/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SESSION_COOKIE_CONFIG } from '@app/unraid-api/auth/cookie.service.js';
import { InternalGraphQLClientFactory } from '@app/unraid-api/shared/internal-graphql-client.factory.js';

// Mock the graphql-ws module
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

describe('InternalGraphQLClientFactory', () => {
    let factory: InternalGraphQLClientFactory;
    let socketConfig: SocketConfigService;
    let configService: ConfigService;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                InternalGraphQLClientFactory,
                {
                    provide: ConfigService,
                    useValue: {
                        get: vi.fn(),
                    },
                },
                {
                    provide: SocketConfigService,
                    useValue: {
                        isRunningOnSocket: vi.fn(),
                        getSocketPath: vi.fn(),
                        getApiAddress: vi.fn(),
                        getWebSocketUri: vi.fn(),
                    },
                },
                {
                    provide: SESSION_COOKIE_CONFIG,
                    useValue: {
                        namePrefix: 'unraid_',
                        sessionDir: '/dev/sessions',
                        secure: true,
                        httpOnly: true,
                    },
                },
            ],
        }).compile();

        factory = module.get<InternalGraphQLClientFactory>(InternalGraphQLClientFactory);
        socketConfig = module.get<SocketConfigService>(SocketConfigService);
        configService = module.get<ConfigService>(ConfigService);
    });

    afterEach(async () => {
        await module?.close();
        vi.clearAllMocks();
    });

    describe('createClient', () => {
        it('should throw error when getApiKey is not provided', async () => {
            await expect(factory.createClient({ getApiKey: null as any })).rejects.toThrow();
        });

        it('should create client with Unix socket configuration', async () => {
            vi.mocked(socketConfig.isRunningOnSocket).mockReturnValue(true);
            vi.mocked(socketConfig.getSocketPath).mockReturnValue('/var/run/unraid-api.sock');
            vi.mocked(socketConfig.getWebSocketUri).mockReturnValue(undefined);

            const client = await factory.createClient({
                getApiKey: async () => 'test-api-key',
                enableSubscriptions: false,
            });

            expect(client).toBeInstanceOf(ApolloClient);
            expect(socketConfig.isRunningOnSocket).toHaveBeenCalled();
            expect(socketConfig.getSocketPath).toHaveBeenCalled();
        });

        it('should create client with HTTP configuration', async () => {
            vi.mocked(socketConfig.isRunningOnSocket).mockReturnValue(false);
            vi.mocked(socketConfig.getApiAddress).mockReturnValue('http://127.0.0.1:3001/graphql');
            vi.mocked(socketConfig.getWebSocketUri).mockReturnValue(undefined);

            const client = await factory.createClient({
                getApiKey: async () => 'test-api-key',
                enableSubscriptions: false,
            });

            expect(client).toBeInstanceOf(ApolloClient);
            expect(socketConfig.getApiAddress).toHaveBeenCalledWith('http');
        });

        it('should create client with WebSocket subscriptions enabled on Unix socket', async () => {
            vi.mocked(socketConfig.isRunningOnSocket).mockReturnValue(true);
            vi.mocked(socketConfig.getSocketPath).mockReturnValue('/var/run/unraid-api.sock');
            vi.mocked(socketConfig.getWebSocketUri).mockReturnValue(
                'ws+unix:///var/run/unraid-api.sock:/graphql'
            );

            const client = await factory.createClient({
                getApiKey: async () => 'test-api-key',
                enableSubscriptions: true,
            });

            expect(client).toBeInstanceOf(ApolloClient);
            expect(socketConfig.getWebSocketUri).toHaveBeenCalledWith(true);
        });

        it('should create client with WebSocket subscriptions enabled on TCP', async () => {
            vi.mocked(socketConfig.isRunningOnSocket).mockReturnValue(false);
            vi.mocked(socketConfig.getApiAddress).mockReturnValue('http://127.0.0.1:3001/graphql');
            vi.mocked(socketConfig.getWebSocketUri).mockReturnValue('ws://127.0.0.1:3001/graphql');

            const client = await factory.createClient({
                getApiKey: async () => 'test-api-key',
                enableSubscriptions: true,
            });

            expect(client).toBeInstanceOf(ApolloClient);
            expect(socketConfig.getWebSocketUri).toHaveBeenCalledWith(true);
        });

        it('should use custom origin when provided', async () => {
            vi.mocked(socketConfig.isRunningOnSocket).mockReturnValue(false);
            vi.mocked(socketConfig.getApiAddress).mockReturnValue('http://127.0.0.1:3001/graphql');

            const client = await factory.createClient({
                getApiKey: async () => 'test-api-key',
                enableSubscriptions: false,
                origin: 'custom-origin',
            });

            expect(client).toBeInstanceOf(ApolloClient);
            // The origin would be set in the HTTP headers, but we can't easily verify that with the mocked setup
        });

        it('should use default origin when not provided', async () => {
            vi.mocked(socketConfig.isRunningOnSocket).mockReturnValue(false);
            vi.mocked(socketConfig.getApiAddress).mockReturnValue('http://127.0.0.1:3001/graphql');

            const client = await factory.createClient({
                getApiKey: async () => 'test-api-key',
                enableSubscriptions: false,
            });

            expect(client).toBeInstanceOf(ApolloClient);
            // Default origin should be 'http://localhost'
        });

        it('should handle subscription disabled even when wsUri is provided', async () => {
            vi.mocked(socketConfig.isRunningOnSocket).mockReturnValue(false);
            vi.mocked(socketConfig.getApiAddress).mockReturnValue('http://127.0.0.1:3001/graphql');
            vi.mocked(socketConfig.getWebSocketUri).mockReturnValue(undefined); // Subscriptions disabled

            const client = await factory.createClient({
                getApiKey: async () => 'test-api-key',
                enableSubscriptions: false,
            });

            expect(client).toBeInstanceOf(ApolloClient);
            expect(socketConfig.getWebSocketUri).toHaveBeenCalledWith(false);
        });
    });

    describe('configuration scenarios', () => {
        it('should handle production configuration with Unix socket', async () => {
            vi.mocked(socketConfig.isRunningOnSocket).mockReturnValue(true);
            vi.mocked(socketConfig.getSocketPath).mockReturnValue('/var/run/unraid-api.sock');
            vi.mocked(socketConfig.getWebSocketUri).mockReturnValue(
                'ws+unix:///var/run/unraid-api.sock:/graphql'
            );

            const client = await factory.createClient({
                getApiKey: async () => 'production-key',
                enableSubscriptions: true,
            });

            expect(client).toBeInstanceOf(ApolloClient);
            expect(socketConfig.isRunningOnSocket).toHaveBeenCalled();
            expect(socketConfig.getSocketPath).toHaveBeenCalled();
            expect(socketConfig.getWebSocketUri).toHaveBeenCalledWith(true);
        });

        it('should handle development configuration with TCP port', async () => {
            vi.mocked(socketConfig.isRunningOnSocket).mockReturnValue(false);
            vi.mocked(socketConfig.getApiAddress).mockReturnValue('http://127.0.0.1:3001/graphql');
            vi.mocked(socketConfig.getWebSocketUri).mockReturnValue('ws://127.0.0.1:3001/graphql');

            const client = await factory.createClient({
                getApiKey: async () => 'dev-key',
                enableSubscriptions: true,
            });

            expect(client).toBeInstanceOf(ApolloClient);
            expect(socketConfig.isRunningOnSocket).toHaveBeenCalled();
            expect(socketConfig.getApiAddress).toHaveBeenCalledWith('http');
            expect(socketConfig.getWebSocketUri).toHaveBeenCalledWith(true);
        });

        it('should create multiple clients with different configurations', async () => {
            vi.mocked(socketConfig.isRunningOnSocket).mockReturnValue(false);
            vi.mocked(socketConfig.getApiAddress).mockReturnValue('http://127.0.0.1:3001/graphql');
            vi.mocked(socketConfig.getWebSocketUri)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce('ws://127.0.0.1:3001/graphql');

            const client1 = await factory.createClient({
                getApiKey: async () => 'key1',
                enableSubscriptions: false,
            });

            const client2 = await factory.createClient({
                getApiKey: async () => 'key2',
                enableSubscriptions: true,
            });

            expect(client1).toBeInstanceOf(ApolloClient);
            expect(client2).toBeInstanceOf(ApolloClient);
            expect(client1).not.toBe(client2);
        });
    });
});
