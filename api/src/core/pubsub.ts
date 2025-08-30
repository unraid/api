import EventEmitter from 'events';

import { GRAPHQL_PUBSUB_CHANNEL } from '@unraid/shared/pubsub/graphql.pubsub.js';
import { PubSub } from 'graphql-subscriptions';

// Allow subscriptions to have 30 connections
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(30);

export { GRAPHQL_PUBSUB_CHANNEL as PUBSUB_CHANNEL };

export const pubsub = new PubSub({ eventEmitter });

/**
 * Create a pubsub subscription.
 * @param channel The pubsub channel to subscribe to.
 */
export const createSubscription = <T = any>(
    channel: GRAPHQL_PUBSUB_CHANNEL
): AsyncIterableIterator<T> => {
    return pubsub.asyncIterableIterator<T>(channel);
};
