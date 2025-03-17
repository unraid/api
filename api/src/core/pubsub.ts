import EventEmitter from 'events';

import { PubSub } from 'graphql-subscriptions';

// Allow subscriptions to have 30 connections
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(30);

export enum PUBSUB_CHANNEL {
    ARRAY = 'ARRAY',
    DASHBOARD = 'DASHBOARD',
    DISPLAY = 'DISPLAY',
    INFO = 'INFO',
    NOTIFICATION = 'NOTIFICATION',
    NOTIFICATION_ADDED = 'NOTIFICATION_ADDED',
    NOTIFICATION_OVERVIEW = 'NOTIFICATION_OVERVIEW',
    OWNER = 'OWNER',
    SERVERS = 'SERVERS',
    VMS = 'VMS',
    REGISTRATION = 'REGISTRATION',
    LOG_FILE = 'LOG_FILE',
}

export const pubsub = new PubSub({ eventEmitter });

/**
 * Create a pubsub subscription.
 * @param channel The pubsub channel to subscribe to.
 */
export const createSubscription = (channel: PUBSUB_CHANNEL) => {
    return pubsub.asyncIterator(channel);
};
