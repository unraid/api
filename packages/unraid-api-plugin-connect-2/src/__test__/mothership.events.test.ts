import { EventEmitter2 } from '@nestjs/event-emitter';

import { PubSub } from 'graphql-subscriptions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MinigraphStatus } from '../config/connect.config.js';
import { EVENTS, GRAPHQL_PUBSUB_CHANNEL } from '../helper/nest-tokens.js';
import { MothershipConnectionService } from '../mothership-proxy/connection.service.js';
import { MothershipController } from '../mothership-proxy/mothership.controller.js';
import { MothershipHandler } from '../mothership-proxy/mothership.events.js';

describe('MothershipHandler - Behavioral Tests', () => {
    let handler: MothershipHandler;
    let connectionService: MothershipConnectionService;
    let mothershipController: MothershipController;
    let pubSub: PubSub;
    let eventEmitter: EventEmitter2;

    // Track actual state changes and effects
    let connectionAttempts: Array<{ timestamp: number; reason: string }> = [];
    let publishedMessages: Array<{ channel: string; data: any }> = [];
    let controllerStops: Array<{ timestamp: number; reason?: string }> = [];

    beforeEach(() => {
        // Reset tracking arrays
        connectionAttempts = [];
        publishedMessages = [];
        controllerStops = [];

        // Create real event emitter for integration testing
        eventEmitter = new EventEmitter2();

        // Mock connection service with realistic behavior
        connectionService = {
            getIdentityState: vi.fn(),
            getConnectionState: vi.fn(),
        } as any;

        // Mock controller that tracks behavior instead of just method calls
        mothershipController = {
            initOrRestart: vi.fn().mockImplementation(() => {
                connectionAttempts.push({
                    timestamp: Date.now(),
                    reason: 'initOrRestart called',
                });
                return Promise.resolve();
            }),
            stop: vi.fn().mockImplementation(() => {
                controllerStops.push({
                    timestamp: Date.now(),
                });
                return Promise.resolve();
            }),
        } as any;

        // Mock PubSub that tracks published messages
        pubSub = {
            publish: vi.fn().mockImplementation((channel: string, data: any) => {
                publishedMessages.push({ channel, data });
                return Promise.resolve();
            }),
        } as any;

        handler = new MothershipHandler(connectionService, mothershipController, pubSub);
    });

    describe('Connection Recovery Behavior', () => {
        it('should attempt reconnection when ping fails', async () => {
            // Given: Connection is in ping failure state
            vi.mocked(connectionService.getConnectionState).mockReturnValue({
                status: MinigraphStatus.PING_FAILURE,
                error: 'Ping timeout after 3 minutes',
            });

            // When: Connection status change event occurs
            await handler.onMothershipConnectionStatusChanged();

            // Then: System should attempt to recover the connection
            expect(connectionAttempts).toHaveLength(1);
            expect(connectionAttempts[0].reason).toBe('initOrRestart called');
        });

        it('should NOT interfere with exponential backoff during error retry state', async () => {
            // Given: Connection is in error retry state (GraphQL client managing backoff)
            vi.mocked(connectionService.getConnectionState).mockReturnValue({
                status: MinigraphStatus.ERROR_RETRYING,
                error: 'Network error',
                timeout: 20000,
                timeoutStart: Date.now(),
            });

            // When: Connection status change event occurs
            await handler.onMothershipConnectionStatusChanged();

            // Then: System should NOT interfere with ongoing retry logic
            expect(connectionAttempts).toHaveLength(0);
        });

        it('should remain stable during normal connection states', async () => {
            const stableStates = [MinigraphStatus.CONNECTED, MinigraphStatus.CONNECTING];

            for (const status of stableStates) {
                // Reset for each test
                connectionAttempts.length = 0;

                // Given: Connection is in a stable state
                vi.mocked(connectionService.getConnectionState).mockReturnValue({
                    status,
                    error: null,
                });

                // When: Connection status change event occurs
                await handler.onMothershipConnectionStatusChanged();

                // Then: System should not trigger unnecessary reconnection attempts
                expect(connectionAttempts).toHaveLength(0);
            }
        });
    });

    describe('Identity-Based Connection Behavior', () => {
        it('should establish connection when valid API key becomes available', async () => {
            // Given: Valid API key is present
            vi.mocked(connectionService.getIdentityState).mockReturnValue({
                state: {
                    apiKey: 'valid-unraid-key-12345',
                    unraidVersion: '6.12.0',
                    flashGuid: 'test-flash-guid',
                    apiVersion: '1.0.0',
                },
                isLoaded: true,
            });

            // When: Identity changes
            await handler.onIdentityChanged();

            // Then: System should establish mothership connection
            expect(connectionAttempts).toHaveLength(1);
        });

        it('should not attempt connection without valid credentials', async () => {
            const invalidCredentials = [{ apiKey: undefined }, { apiKey: '' }];

            for (const credentials of invalidCredentials) {
                // Reset for each test
                connectionAttempts.length = 0;

                // Given: Invalid or missing API key
                vi.mocked(connectionService.getIdentityState).mockReturnValue({
                    state: credentials,
                    isLoaded: false,
                });

                // When: Identity changes
                await handler.onIdentityChanged();

                // Then: System should not attempt connection
                expect(connectionAttempts).toHaveLength(0);
            }
        });
    });

    describe('Logout Behavior', () => {
        it('should properly clean up connections and notify subscribers on logout', async () => {
            // When: User logs out
            await handler.logout({ reason: 'User initiated logout' });

            // Then: System should clean up connections
            expect(controllerStops).toHaveLength(1);

            // And: Subscribers should be notified of empty state
            expect(publishedMessages).toHaveLength(2);

            const serversMessage = publishedMessages.find(
                (m) => m.channel === GRAPHQL_PUBSUB_CHANNEL.SERVERS
            );
            const ownerMessage = publishedMessages.find(
                (m) => m.channel === GRAPHQL_PUBSUB_CHANNEL.OWNER
            );

            expect(serversMessage?.data).toEqual({ servers: [] });
            expect(ownerMessage?.data).toEqual({
                owner: { username: 'root', url: '', avatar: '' },
            });
        });

        it('should handle logout gracefully even without explicit reason', async () => {
            // When: System logout occurs without reason
            await handler.logout({});

            // Then: Cleanup should still occur properly
            expect(controllerStops).toHaveLength(1);
            expect(publishedMessages).toHaveLength(2);
        });
    });

    describe('DDoS Prevention Behavior', () => {
        it('should demonstrate exponential backoff is respected during network errors', async () => {
            // Given: Multiple rapid network errors occur
            const errorStates = [
                { status: MinigraphStatus.ERROR_RETRYING, error: 'Network error 1' },
                { status: MinigraphStatus.ERROR_RETRYING, error: 'Network error 2' },
                { status: MinigraphStatus.ERROR_RETRYING, error: 'Network error 3' },
            ];

            // When: Rapid error retry states occur
            for (const state of errorStates) {
                vi.mocked(connectionService.getConnectionState).mockReturnValue(state);
                await handler.onMothershipConnectionStatusChanged();
            }

            // Then: No linear retry attempts should be made (respecting exponential backoff)
            expect(connectionAttempts).toHaveLength(0);
        });

        it('should differentiate between network errors and ping failures', async () => {
            // Given: Network error followed by ping failure
            vi.mocked(connectionService.getConnectionState).mockReturnValue({
                status: MinigraphStatus.ERROR_RETRYING,
                error: 'Network error',
            });

            // When: Network error occurs
            await handler.onMothershipConnectionStatusChanged();

            // Then: No immediate reconnection attempt
            expect(connectionAttempts).toHaveLength(0);

            // Given: Ping failure occurs (different issue)
            vi.mocked(connectionService.getConnectionState).mockReturnValue({
                status: MinigraphStatus.PING_FAILURE,
                error: 'Ping timeout',
            });

            // When: Ping failure occurs
            await handler.onMothershipConnectionStatusChanged();

            // Then: Immediate reconnection attempt should occur
            expect(connectionAttempts).toHaveLength(1);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle missing connection state gracefully', async () => {
            // Given: Connection service returns undefined
            vi.mocked(connectionService.getConnectionState).mockReturnValue(undefined);

            // When: Connection status change occurs
            await handler.onMothershipConnectionStatusChanged();

            // Then: No errors should occur, no reconnection attempts
            expect(connectionAttempts).toHaveLength(0);
        });

        it('should handle malformed connection state', async () => {
            // Given: Malformed connection state
            vi.mocked(connectionService.getConnectionState).mockReturnValue({
                status: 'UNKNOWN_STATUS' as any,
                error: 'Malformed state',
            });

            // When: Connection status change occurs
            await handler.onMothershipConnectionStatusChanged();

            // Then: Should not trigger reconnection for unknown states
            expect(connectionAttempts).toHaveLength(0);
        });
    });
});
