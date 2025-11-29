import { Inject, Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'class-validator';
import { type Subscription } from 'zen-observable-ts';
import { CANONICAL_INTERNAL_CLIENT_TOKEN, type CanonicalInternalClientService } from '@unraid/shared';

import { EVENTS_SUBSCRIPTION, RemoteGraphQL_Fragment } from '../graphql/event.js';
import {
    ClientType,
    RemoteGraphQlEventFragmentFragment,
    RemoteGraphQlEventType,
} from '../graphql/generated/client/graphql.js';
import { useFragment } from '../graphql/generated/client/index.js';
import { SEND_REMOTE_QUERY_RESPONSE } from '../graphql/remote-response.js';
import { parseGraphQLQuery } from '../helper/parse-graphql.js';
import { MothershipConnectionService } from './connection.service.js';
import { UnraidServerClientService } from './unraid-server-client.service.js';

interface SubscriptionInfo {
    sha256: string;
    createdAt: number;
    lastPing: number;
    operationId?: string;
}

@Injectable()
export class MothershipSubscriptionHandler {
    constructor(
        @Inject(CANONICAL_INTERNAL_CLIENT_TOKEN)
        private readonly internalClientService: CanonicalInternalClientService,
        private readonly mothershipClient: MothershipGraphqlClientService,
        private readonly connectionService: MothershipConnectionService
    ) {}

    private readonly logger = new Logger(MothershipSubscriptionHandler.name);
    private readonly activeSubscriptions = new Map<string, SubscriptionInfo>();

    removeSubscription(sha256: string) {
        const subscription = this.activeSubscriptions.get(sha256);
        if (subscription) {
            this.logger.debug(`Removing subscription ${sha256}`);
            this.activeSubscriptions.delete(sha256);
            
            // Stop the subscription via the UnraidServerClient if it has an operationId
            const client = this.mothershipClient.getClient();
            if (client && subscription.operationId) {
                // Note: We can't directly call stopSubscription on the client since it's private
                // This would need to be exposed or handled differently in a real implementation
                this.logger.debug(`Should stop subscription with operationId: ${subscription.operationId}`);
            }
        } else {
            this.logger.debug(`Subscription ${sha256} not found`);
        }
    }

    clearAllSubscriptions() {
        this.logger.verbose(`Clearing ${this.activeSubscriptions.size} active subscriptions`);
        
        // Stop all subscriptions via the UnraidServerClient
        const client = this.mothershipClient.getClient();
        if (client) {
            for (const [sha256, subscription] of this.activeSubscriptions.entries()) {
                if (subscription.operationId) {
                    this.logger.debug(`Should stop subscription with operationId: ${subscription.operationId}`);
                }
            }
        }
        
        this.activeSubscriptions.clear();
    }

    clearStaleSubscriptions({ maxAgeMs }: { maxAgeMs: number }) {
        const now = Date.now();
        const staleSubscriptions: string[] = [];
        
        for (const [sha256, subscription] of this.activeSubscriptions.entries()) {
            const age = now - subscription.lastPing;
            if (age > maxAgeMs) {
                staleSubscriptions.push(sha256);
            }
        }
        
        if (staleSubscriptions.length > 0) {
            this.logger.verbose(`Clearing ${staleSubscriptions.length} stale subscriptions older than ${maxAgeMs}ms`);
            
            for (const sha256 of staleSubscriptions) {
                this.removeSubscription(sha256);
            }
        } else {
            this.logger.verbose(`No stale subscriptions found (${this.activeSubscriptions.size} active)`);
        }
    }

    pingSubscription(sha256: string) {
        const subscription = this.activeSubscriptions.get(sha256);
        if (subscription) {
            subscription.lastPing = Date.now();
            this.logger.verbose(`Updated ping for subscription ${sha256}`);
        } else {
            this.logger.verbose(`Ping for unknown subscription ${sha256}`);
        }
    }

    addSubscription(sha256: string, operationId?: string) {
        const now = Date.now();
        const subscription: SubscriptionInfo = {
            sha256,
            createdAt: now,
            lastPing: now,
            operationId
        };
        
        this.activeSubscriptions.set(sha256, subscription);
        this.logger.debug(`Added subscription ${sha256} ${operationId ? `with operationId: ${operationId}` : ''}`);
    }

    stopMothershipSubscription() {
        this.logger.verbose('Stopping mothership subscription (not implemented yet)');
    }

    async subscribeToMothershipEvents() {
        this.logger.log('Subscribing to mothership events via UnraidServerClient');
        
        // For now, just log that we're connected
        // The UnraidServerClient handles the WebSocket connection automatically
        const client = this.mothershipClient.getClient();
        if (client) {
            this.logger.log('UnraidServerClient is connected and handling mothership communication');
        } else {
            this.logger.warn('UnraidServerClient is not available');
        }
    }

    async executeQuery(sha256: string, body: string) {
        this.logger.debug(`Request to execute query ${sha256}: ${body} (simplified implementation)`);
        
        try {
            // For now, just return a success response
            // TODO: Implement actual query execution via the UnraidServerClient
            return {
                data: {
                    message: 'Query executed successfully (simplified)',
                    sha256,
                }
            };
        } catch (error: any) {
            this.logger.error(`Error executing query ${sha256}:`, error);
            return {
                errors: [
                    {
                        message: `Query execution failed: ${error?.message || 'Unknown error'}`,
                        extensions: { code: 'EXECUTION_ERROR' },
                    },
                ],
            };
        }
    }
}