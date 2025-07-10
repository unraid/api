import { PubSub } from 'graphql-subscriptions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MinigraphStatus } from '../config/connect.config.js';
import { GRAPHQL_PUBSUB_CHANNEL } from '../helper/nest-tokens.js';
import { MothershipConnectionService } from '../mothership-proxy/connection.service.js';
import { MothershipController } from '../mothership-proxy/mothership.controller.js';
import { MothershipHandler } from '../mothership-proxy/mothership.events.js';

describe('MothershipHandler', () => {
    let handler: MothershipHandler;
    let mockConnectionService: any;
    let mockMothershipController: any;
    let mockLegacyPubSub: any;

    beforeEach(() => {
        mockConnectionService = {
            getIdentityState: vi.fn(),
            getConnectionState: vi.fn(),
        };

        mockMothershipController = {
            initOrRestart: vi.fn(),
            stop: vi.fn(),
        };

        mockLegacyPubSub = {
            publish: vi.fn(),
        };

        handler = new MothershipHandler(
            mockConnectionService as MothershipConnectionService,
            mockMothershipController as MothershipController,
            mockLegacyPubSub as PubSub
        );
    });

    describe('onMothershipConnectionStatusChanged', () => {
        it('should call initOrRestart when status is PING_FAILURE', async () => {
            mockConnectionService.getConnectionState.mockReturnValue({
                status: MinigraphStatus.PING_FAILURE,
                error: 'Test ping failure',
            });

            await handler.onMothershipConnectionStatusChanged();

            expect(mockMothershipController.initOrRestart).toHaveBeenCalledTimes(1);
        });

        it('should NOT call initOrRestart when status is ERROR_RETRYING (respecting exponential backoff)', async () => {
            mockConnectionService.getConnectionState.mockReturnValue({
                status: MinigraphStatus.ERROR_RETRYING,
                error: 'Test error retrying',
            });

            await handler.onMothershipConnectionStatusChanged();

            expect(mockMothershipController.initOrRestart).not.toHaveBeenCalled();
        });

        it('should NOT call initOrRestart when status is CONNECTED', async () => {
            mockConnectionService.getConnectionState.mockReturnValue({
                status: MinigraphStatus.CONNECTED,
                error: null,
            });

            await handler.onMothershipConnectionStatusChanged();

            expect(mockMothershipController.initOrRestart).not.toHaveBeenCalled();
        });

        it('should NOT call initOrRestart when status is CONNECTING', async () => {
            mockConnectionService.getConnectionState.mockReturnValue({
                status: MinigraphStatus.CONNECTING,
                error: null,
            });

            await handler.onMothershipConnectionStatusChanged();

            expect(mockMothershipController.initOrRestart).not.toHaveBeenCalled();
        });

        it('should NOT call initOrRestart when connection state is null', async () => {
            mockConnectionService.getConnectionState.mockReturnValue(null);

            await handler.onMothershipConnectionStatusChanged();

            expect(mockMothershipController.initOrRestart).not.toHaveBeenCalled();
        });

        it('should NOT call initOrRestart when connection state is undefined', async () => {
            mockConnectionService.getConnectionState.mockReturnValue(undefined);

            await handler.onMothershipConnectionStatusChanged();

            expect(mockMothershipController.initOrRestart).not.toHaveBeenCalled();
        });
    });

    describe('onIdentityChanged', () => {
        it('should call initOrRestart when API key is present', async () => {
            mockConnectionService.getIdentityState.mockReturnValue({
                state: { apiKey: 'test-api-key' },
            });

            await handler.onIdentityChanged();

            expect(mockMothershipController.initOrRestart).toHaveBeenCalledTimes(1);
        });

        it('should NOT call initOrRestart when API key is missing', async () => {
            mockConnectionService.getIdentityState.mockReturnValue({
                state: { apiKey: null },
            });

            await handler.onIdentityChanged();

            expect(mockMothershipController.initOrRestart).not.toHaveBeenCalled();
        });

        it('should NOT call initOrRestart when API key is empty string', async () => {
            mockConnectionService.getIdentityState.mockReturnValue({
                state: { apiKey: '' },
            });

            await handler.onIdentityChanged();

            expect(mockMothershipController.initOrRestart).not.toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        it('should publish empty servers and default owner data, then stop controller', async () => {
            await handler.logout({ reason: 'Test logout' });

            expect(mockLegacyPubSub.publish).toHaveBeenCalledTimes(2);
            expect(mockLegacyPubSub.publish).toHaveBeenCalledWith(
                GRAPHQL_PUBSUB_CHANNEL.SERVERS,
                { servers: [] }
            );
            expect(mockLegacyPubSub.publish).toHaveBeenCalledWith(
                GRAPHQL_PUBSUB_CHANNEL.OWNER,
                { owner: { username: 'root', url: '', avatar: '' } }
            );
            expect(mockMothershipController.stop).toHaveBeenCalledTimes(1);
        });

        it('should handle logout without reason', async () => {
            await handler.logout({});

            expect(mockLegacyPubSub.publish).toHaveBeenCalledTimes(2);
            expect(mockMothershipController.stop).toHaveBeenCalledTimes(1);
        });
    });

    describe('exponential backoff behavior', () => {
        it('should demonstrate that ERROR_RETRYING allows GraphQL client retry logic to handle exponential backoff', async () => {
            // When connection is in ERROR_RETRYING state
            mockConnectionService.getConnectionState.mockReturnValue({
                status: MinigraphStatus.ERROR_RETRYING,
                error: 'Network error',
                timeout: 20000, // 20 seconds from retry logic
                timeoutStart: Date.now(),
            });

            // The handler should NOT call initOrRestart
            await handler.onMothershipConnectionStatusChanged();

            // This ensures that the GraphQL client's RetryLink with exponential backoff
            // continues to manage the reconnection attempts, preventing linear retries
            expect(mockMothershipController.initOrRestart).not.toHaveBeenCalled();
        });

        it('should demonstrate that PING_FAILURE triggers immediate reconnection', async () => {
            // When connection fails to ping (different from retry scenario)
            mockConnectionService.getConnectionState.mockReturnValue({
                status: MinigraphStatus.PING_FAILURE,
                error: 'Ping timeout',
            });

            // The handler SHOULD call initOrRestart for ping failures
            await handler.onMothershipConnectionStatusChanged();

            // This is expected behavior for ping failures which are detected
            // by the timeout checker, not the GraphQL retry logic
            expect(mockMothershipController.initOrRestart).toHaveBeenCalledTimes(1);
        });
    });
}); 