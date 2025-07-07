import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { MinigraphStatus } from '../config/connect.config.js';
import { EVENTS } from '../helper/nest-tokens.js';
import { MothershipConnectionService } from './connection.service.js';
import { MothershipSubscriptionHandlerV2 } from './mothership-subscription-handler-v2.js';
import { MothershipWebSocketClient } from './mothership-websocket-client.js';

@Injectable()
export class MothershipServiceV2 implements OnModuleDestroy {
    private readonly logger = new Logger(MothershipServiceV2.name);
    private isInitialized = false;

    constructor(
        private readonly connectionService: MothershipConnectionService,
        private readonly websocketClient: MothershipWebSocketClient,
        private readonly subscriptionHandler: MothershipSubscriptionHandlerV2,
        private readonly eventEmitter: EventEmitter2
    ) {
        this.initialize();
    }

    async onModuleDestroy() {
        await this.disconnect();
    }

    private initialize(): void {
        if (this.isInitialized) return;
        
        this.subscriptionHandler.setWebSocketClient(this.websocketClient);
        this.setupEventListeners();
        this.isInitialized = true;
        
        this.logger.debug('MothershipServiceV2 initialized');
    }

    private setupEventListeners(): void {
        this.eventEmitter.on('mothership.subscription.data', (message) => {
            this.subscriptionHandler.handleWebSocketMessage(message);
        });
    }

    async attemptConnection(): Promise<void> {
        try {
            const { state, isLoaded } = this.connectionService.getIdentityState();
            
            if (!isLoaded || !state.apiKey) {
                this.logger.warn('Cannot connect: missing API key or identity not loaded');
                return;
            }

            this.logger.debug('Attempting mothership connection');
            
            await this.websocketClient.connect();
            await this.subscriptionHandler.subscribeToServerEvents();
            
            this.logger.debug('Mothership connection established');
            
        } catch (error) {
            this.logger.error(`Failed to establish mothership connection: ${error}`);
            this.connectionService.setConnectionStatus({
                status: MinigraphStatus.ERROR_RETRYING,
                error: error instanceof Error ? error.message : 'Unknown connection error'
            });
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.subscriptionHandler.unsubscribeFromServerEvents();
            await this.websocketClient.disconnect();
            this.subscriptionHandler.clearAllSubscriptions();
            
            this.logger.debug('Mothership connection closed');
            
        } catch (error) {
            this.logger.error(`Error during disconnect: ${error}`);
        }
    }

    async reconnect(): Promise<void> {
        this.logger.debug('Reconnecting to mothership');
        await this.disconnect();
        await this.attemptConnection();
    }

    isConnected(): boolean {
        return this.websocketClient.isConnected();
    }

    getConnectionStatus() {
        return this.connectionService.getConnectionState();
    }

    getActiveSubscriptions(): string[] {
        return this.subscriptionHandler.getActiveSubscriptions();
    }

    getSubscriptionCount(): number {
        return this.subscriptionHandler.getSubscriptionCount();
    }

    async sendMessage(message: any): Promise<void> {
        if (!this.isConnected()) {
            throw new Error('Cannot send message: not connected to mothership');
        }
        
        this.websocketClient.send(message);
    }

    async subscribeToCustomEvents(eventType: string): Promise<string> {
        if (!this.isConnected()) {
            await this.attemptConnection();
        }

        const subscriptionId = `custom-${eventType}-${Date.now()}`;
        
        await this.websocketClient.subscribe({
            type: 'subscribe',
            id: subscriptionId,
            payload: { eventType }
        });

        this.subscriptionHandler.addSubscription(subscriptionId);
        
        this.logger.debug(`Subscribed to custom events: ${eventType} (ID: ${subscriptionId})`);
        
        return subscriptionId;
    }

    async unsubscribeFromCustomEvents(subscriptionId: string): Promise<void> {
        if (this.subscriptionHandler.isSubscriptionActive(subscriptionId)) {
            await this.websocketClient.unsubscribe(subscriptionId);
            this.subscriptionHandler.removeSubscription(subscriptionId);
            
            this.logger.debug(`Unsubscribed from custom events: ${subscriptionId}`);
        }
    }

    ping(): void {
        if (this.isConnected()) {
            this.websocketClient.ping();
        }
    }
}