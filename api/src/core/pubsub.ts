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
 * @param channel The pubsub channel to subscribe to. Can be either a predefined GRAPHQL_PUBSUB_CHANNEL
 *                or a dynamic string for runtime-generated topics (e.g., log file paths like "LOG_FILE:/var/log/test.log")
 */
export const createSubscription = <T = any>(
    channel: GRAPHQL_PUBSUB_CHANNEL | string
): AsyncIterableIterator<T> => {
    return pubsub.asyncIterableIterator<T>(channel);
};
