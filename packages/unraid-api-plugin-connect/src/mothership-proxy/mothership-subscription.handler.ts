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

@Injectable()
export class MothershipSubscriptionHandler {
    constructor(
        @Inject(CANONICAL_INTERNAL_CLIENT_TOKEN)
        private readonly internalClientService: CanonicalInternalClientService,
        private readonly mothershipClient: MothershipGraphqlClientService,
        private readonly connectionService: MothershipConnectionService
    ) {}

    private readonly logger = new Logger(MothershipSubscriptionHandler.name);

    removeSubscription(sha256: string) {
        this.logger.debug(`Request to remove subscription ${sha256} (not implemented yet)`);
    }

    clearAllSubscriptions() {
        this.logger.verbose('Request to clear all active subscriptions (not implemented yet)');
    }

    clearStaleSubscriptions({ maxAgeMs }: { maxAgeMs: number }) {
        this.logger.verbose(`Request to clear stale subscriptions older than ${maxAgeMs}ms (not implemented yet)`);
    }

    pingSubscription(sha256: string) {
        this.logger.verbose(`Ping subscription ${sha256} (not implemented yet)`);
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