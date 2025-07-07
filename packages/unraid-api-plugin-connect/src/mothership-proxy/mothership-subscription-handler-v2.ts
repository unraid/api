import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import type { MothershipWebSocketClient } from './mothership-websocket-client.js';

interface SubscriptionEntry {
    id: string;
    createdAt: number;
    lastActivity: number;
    isActive: boolean;
}

@Injectable()
export class MothershipSubscriptionHandlerV2 implements OnModuleDestroy {
    private readonly logger = new Logger(MothershipSubscriptionHandlerV2.name);
    private subscriptions = new Map<string, SubscriptionEntry>();
    private websocketClient: MothershipWebSocketClient | null = null;

    async onModuleDestroy() {
        this.clearAllSubscriptions();
        this.websocketClient = null;
    }

    setWebSocketClient(client: MothershipWebSocketClient) {
        this.websocketClient = client;
    }

    addSubscription(id: string): void {
        const now = Date.now();
        this.subscriptions.set(id, {
            id,
            createdAt: now,
            lastActivity: now,
            isActive: true,
        });
        this.logger.debug(`Added subscription: ${id}`);
    }

    removeSubscription(id: string): void {
        const subscription = this.subscriptions.get(id);
        if (subscription) {
            subscription.isActive = false;
            this.subscriptions.delete(id);
            this.logger.debug(`Removed subscription: ${id}`);
        }
    }

    updateSubscriptionActivity(id: string): void {
        const subscription = this.subscriptions.get(id);
        if (subscription) {
            subscription.lastActivity = Date.now();
        }
    }

    clearStaleSubscriptions({ maxAgeMs }: { maxAgeMs: number }): void {
        const now = Date.now();
        const staleSubscriptions: string[] = [];

        for (const [id, subscription] of this.subscriptions) {
            if (now - subscription.lastActivity > maxAgeMs) {
                staleSubscriptions.push(id);
            }
        }

        if (staleSubscriptions.length > 0) {
            this.logger.debug(`Clearing ${staleSubscriptions.length} stale subscriptions`);
            staleSubscriptions.forEach(id => this.removeSubscription(id));
        }
    }

    clearAllSubscriptions(): void {
        this.subscriptions.clear();
        this.logger.debug('Cleared all subscriptions');
    }

    getActiveSubscriptions(): string[] {
        return Array.from(this.subscriptions.keys()).filter(id => 
            this.subscriptions.get(id)?.isActive
        );
    }

    getSubscriptionCount(): number {
        return this.subscriptions.size;
    }

    isSubscriptionActive(id: string): boolean {
        return this.subscriptions.get(id)?.isActive ?? false;
    }

    async handleWebSocketMessage(message: any): Promise<void> {
        try {
            if (message.type === 'subscription_data' && message.subscriptionId) {
                this.updateSubscriptionActivity(message.subscriptionId);
                this.logger.debug(`Received subscription data for: ${message.subscriptionId}`);
            }
        } catch (error) {
            this.logger.error(`Error handling WebSocket message: ${error}`);
        }
    }

    async subscribeToServerEvents(): Promise<void> {
        if (!this.websocketClient) {
            this.logger.warn('No WebSocket client available for subscription');
            return;
        }

        try {
            const subscriptionId = `server-events-${Date.now()}`;
            this.addSubscription(subscriptionId);
            
            await this.websocketClient.subscribe({
                type: 'subscribe',
                id: subscriptionId,
                payload: { eventType: 'server_events' }
            });

            this.logger.debug(`Subscribed to server events with ID: ${subscriptionId}`);
        } catch (error) {
            this.logger.error(`Failed to subscribe to server events: ${error}`);
        }
    }

    async unsubscribeFromServerEvents(): Promise<void> {
        const serverEventSubscriptions = this.getActiveSubscriptions()
            .filter(id => id.startsWith('server-events-'));

        for (const subscriptionId of serverEventSubscriptions) {
            try {
                if (this.websocketClient) {
                    await this.websocketClient.unsubscribe(subscriptionId);
                }
                this.removeSubscription(subscriptionId);
                this.logger.debug(`Unsubscribed from server events: ${subscriptionId}`);
            } catch (error) {
                this.logger.error(`Failed to unsubscribe from ${subscriptionId}: ${error}`);
            }
        }
    }
}