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
import { MothershipGraphqlClientService } from './graphql.client.js';

type SubscriptionProxy = {
    sha256: string;
    body: string;
};

type ActiveSubscription = {
    subscription: Subscription;
    lastPing: number;
};

@Injectable()
export class MothershipSubscriptionHandler {
    constructor(
        @Inject(CANONICAL_INTERNAL_CLIENT_TOKEN)
        private readonly internalClientService: CanonicalInternalClientService,
        private readonly mothershipClient: MothershipGraphqlClientService,
        private readonly connectionService: MothershipConnectionService
    ) {}

    private readonly logger = new Logger(MothershipSubscriptionHandler.name);
    private subscriptions: Map<string, ActiveSubscription> = new Map();
    private mothershipSubscription: Subscription | null = null;

    removeSubscription(sha256: string) {
        this.subscriptions.get(sha256)?.subscription.unsubscribe();
        const removed = this.subscriptions.delete(sha256);
        // If this line outputs false, the subscription did not exist in the map.
        this.logger.debug(`Removed subscription ${sha256}: ${removed}`);
        this.logger.verbose(`Current active subscriptions: ${this.subscriptions.size}`);
    }

    clearAllSubscriptions() {
        this.logger.verbose('Clearing all active subscriptions');
        this.subscriptions.forEach(({ subscription }) => {
            subscription.unsubscribe();
        });
        this.subscriptions.clear();
        this.logger.verbose(`Current active subscriptions: ${this.subscriptions.size}`);
    }

    clearStaleSubscriptions({ maxAgeMs }: { maxAgeMs: number }) {
        if (this.subscriptions.size === 0) {
            return;
        }
        const totalSubscriptions = this.subscriptions.size;
        let numOfStaleSubscriptions = 0;
        const now = Date.now();
        this.subscriptions
            .entries()
            .filter(([, { lastPing }]) => {
                return now - lastPing > maxAgeMs;
            })
            .forEach(([sha256]) => {
                this.removeSubscription(sha256);
                numOfStaleSubscriptions++;
            });
        this.logger.verbose(
            `Cleared ${numOfStaleSubscriptions}/${totalSubscriptions} subscriptions (older than ${maxAgeMs}ms)`
        );
    }

    pingSubscription(sha256: string) {
        const subscription = this.subscriptions.get(sha256);
        if (subscription) {
            subscription.lastPing = Date.now();
        } else {
            this.logger.warn(`Subscription ${sha256} not found; cannot ping`);
        }
    }

    public async addSubscription({ sha256, body }: SubscriptionProxy) {
        if (this.subscriptions.has(sha256)) {
            throw new Error(`Subscription already exists for SHA256: ${sha256}`);
        }
        const parsedBody = parseGraphQLQuery(body);
        const client = await this.internalClientService.getClient();
        const observable = client.subscribe({
            query: parsedBody.query,
            variables: parsedBody.variables,
        });
        const subscription = observable.subscribe({
            next: async (val) => {
                this.logger.verbose(`Subscription ${sha256} received value: %O`, val);
                if (!val.data) return;
                const result = await this.mothershipClient.sendQueryResponse(sha256, {
                    data: val.data,
                });
                this.logger.verbose(`Subscription ${sha256} published result: %O`, result);
            },
            error: async (err) => {
                this.logger.warn(`Subscription ${sha256} error: %O`, err);
                await this.mothershipClient.sendQueryResponse(sha256, {
                    errors: err,
                });
            },
        });
        this.subscriptions.set(sha256, {
            subscription,
            lastPing: Date.now(),
        });
        this.logger.verbose(`Added subscription ${sha256}`);
        return {
            sha256,
            subscription,
        };
    }

    async executeQuery(sha256: string, body: string) {
        const internalClient = await this.internalClientService.getClient();
        const parsedBody = parseGraphQLQuery(body);
        const queryInput = {
            query: parsedBody.query,
            variables: parsedBody.variables,
        };
        this.logger.verbose(`Executing query: %O`, queryInput);

        const result = await internalClient.query(queryInput);
        if (result.error) {
            this.logger.warn(`Query returned error: %O`, result.error);
            this.mothershipClient.sendQueryResponse(sha256, {
                errors: result.error,
            });
            return result;
        }
        this.mothershipClient.sendQueryResponse(sha256, {
            data: result.data,
        });
        return result;
    }

    async safeExecuteQuery(sha256: string, body: string) {
        try {
            return await this.executeQuery(sha256, body);
        } catch (error) {
            this.logger.error(error);
            this.mothershipClient.sendQueryResponse(sha256, {
                errors: error,
            });
        }
    }

    async handleRemoteGraphQLEvent(event: RemoteGraphQlEventFragmentFragment) {
        const { body, type, sha256 } = event.remoteGraphQLEventData;
        switch (type) {
            case RemoteGraphQlEventType.REMOTE_QUERY_EVENT:
                return this.safeExecuteQuery(sha256, body);
            case RemoteGraphQlEventType.REMOTE_SUBSCRIPTION_EVENT:
                return this.addSubscription(event.remoteGraphQLEventData);
            case RemoteGraphQlEventType.REMOTE_SUBSCRIPTION_EVENT_PING:
                return this.pingSubscription(sha256);
            default:
                return;
        }
    }

    stopMothershipSubscription() {
        this.mothershipSubscription?.unsubscribe();
        this.mothershipSubscription = null;
    }

    async subscribeToMothershipEvents(client = this.mothershipClient.getClient()) {
        if (!client) {
            this.logger.error('Mothership client unavailable. State might not be loaded.');
            return;
        }
        const subscription = client.subscribe({
            query: EVENTS_SUBSCRIPTION,
            fetchPolicy: 'no-cache',
        });
        this.mothershipSubscription = subscription.subscribe({
            next: (event) => {
                if (event.errors) {
                    this.logger.error(`Error received from mothership: %O`, event.errors);
                    return;
                }
                if (!event.data) return;
                const { events } = event.data;
                for (const event of events?.filter(isDefined) ?? []) {
                    const { __typename: eventType } = event;
                    if (eventType === 'ClientConnectedEvent') {
                        if (
                            event.connectedData.type === ClientType.API &&
                            event.connectedData.apiKey === this.connectionService.getApiKey()
                        ) {
                            this.connectionService.clearDisconnectedTimestamp();
                        }
                    } else if (eventType === 'ClientDisconnectedEvent') {
                        if (
                            event.disconnectedData.type === ClientType.API &&
                            event.disconnectedData.apiKey === this.connectionService.getApiKey()
                        ) {
                            this.connectionService.setDisconnectedTimestamp();
                        }
                    } else if (eventType === 'RemoteGraphQLEvent') {
                        const remoteGraphQLEvent = useFragment(RemoteGraphQL_Fragment, event);
                        return this.handleRemoteGraphQLEvent(remoteGraphQLEvent);
                    }
                }
            },
        });
    }
}
