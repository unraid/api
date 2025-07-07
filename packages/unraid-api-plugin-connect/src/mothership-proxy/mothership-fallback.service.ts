import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import { MothershipConnectionService } from './connection.service.js';
import { MothershipGraphqlClientService } from './graphql.client.js';
import { MothershipSubscriptionHandler } from './mothership-subscription.handler.js';
import { MothershipServiceV2 } from './mothership-service-v2.js';

enum ClientType {
    LEGACY = 'legacy',
    V2 = 'v2',
}

@Injectable()
export class MothershipFallbackService implements OnModuleDestroy {
    private readonly logger = new Logger(MothershipFallbackService.name);
    private currentClient: ClientType = ClientType.V2;
    private connectionAttempts = 0;
    private readonly maxAttempts = 3;

    constructor(
        private readonly connectionService: MothershipConnectionService,
        private readonly legacyClient: MothershipGraphqlClientService,
        private readonly legacySubscriptionHandler: MothershipSubscriptionHandler,
        private readonly v2Service: MothershipServiceV2
    ) {}

    async onModuleDestroy() {
        await this.disconnect();
    }

    async attemptConnection(): Promise<void> {
        this.logger.debug(`Attempting connection with ${this.currentClient} client`);
        
        try {
            if (this.currentClient === ClientType.V2) {
                await this.v2Service.attemptConnection();
            } else {
                await this.connectLegacyClient();
            }
            
            this.connectionAttempts = 0;
            this.logger.debug(`Successfully connected with ${this.currentClient} client`);
            
        } catch (error) {
            this.logger.error(`${this.currentClient} client connection failed: ${error}`);
            
            if (this.shouldFallback()) {
                await this.fallbackToOtherClient();
                await this.attemptConnection();
            } else {
                throw error;
            }
        }
    }

    private async connectLegacyClient(): Promise<void> {
        const client = await this.legacyClient.createClientInstance();
        if (!client) {
            throw new Error('Failed to create legacy GraphQL client');
        }
        await this.legacySubscriptionHandler.subscribeToMothershipEvents(client);
    }

    private shouldFallback(): boolean {
        this.connectionAttempts++;
        return this.connectionAttempts < this.maxAttempts;
    }

    private async fallbackToOtherClient(): Promise<void> {
        const previousClient = this.currentClient;
        this.currentClient = this.currentClient === ClientType.V2 ? ClientType.LEGACY : ClientType.V2;
        
        this.logger.warn(`Falling back from ${previousClient} to ${this.currentClient} client`);
        
        try {
            await this.disconnectCurrentClient(previousClient);
        } catch (error) {
            this.logger.error(`Error disconnecting ${previousClient} client: ${error}`);
        }
    }

    private async disconnectCurrentClient(clientType: ClientType): Promise<void> {
        if (clientType === ClientType.V2) {
            await this.v2Service.disconnect();
        } else {
            this.legacySubscriptionHandler.stopMothershipSubscription();
            await this.legacyClient.clearInstance();
        }
    }

    async disconnect(): Promise<void> {
        await this.disconnectCurrentClient(this.currentClient);
    }

    async reconnect(): Promise<void> {
        this.logger.debug('Reconnecting with fallback support');
        await this.disconnect();
        this.connectionAttempts = 0;
        await this.attemptConnection();
    }

    isConnected(): boolean {
        if (this.currentClient === ClientType.V2) {
            return this.v2Service.isConnected();
        } else {
            return this.legacyClient.getClient() !== null;
        }
    }

    getConnectionStatus() {
        return this.connectionService.getConnectionState();
    }

    getCurrentClientType(): ClientType {
        return this.currentClient;
    }

    getActiveSubscriptions(): string[] {
        if (this.currentClient === ClientType.V2) {
            return this.v2Service.getActiveSubscriptions();
        } else {
            return [];
        }
    }

    getSubscriptionCount(): number {
        if (this.currentClient === ClientType.V2) {
            return this.v2Service.getSubscriptionCount();
        } else {
            return 0;
        }
    }

    async sendMessage(message: any): Promise<void> {
        if (!this.isConnected()) {
            throw new Error('Cannot send message: not connected to mothership');
        }
        
        if (this.currentClient === ClientType.V2) {
            await this.v2Service.sendMessage(message);
        } else {
            this.logger.warn('Legacy client does not support direct message sending');
        }
    }

    async forceUseLegacyClient(): Promise<void> {
        if (this.currentClient === ClientType.LEGACY) {
            this.logger.debug('Already using legacy client');
            return;
        }
        
        this.logger.debug('Forcing switch to legacy client');
        await this.disconnect();
        this.currentClient = ClientType.LEGACY;
        await this.attemptConnection();
    }

    async forceUseV2Client(): Promise<void> {
        if (this.currentClient === ClientType.V2) {
            this.logger.debug('Already using V2 client');
            return;
        }
        
        this.logger.debug('Forcing switch to V2 client');
        await this.disconnect();
        this.currentClient = ClientType.V2;
        await this.attemptConnection();
    }

    ping(): void {
        if (this.currentClient === ClientType.V2) {
            this.v2Service.ping();
        } else {
            this.logger.debug('Legacy client ping not implemented');
        }
    }
}