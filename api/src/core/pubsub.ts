import { PubSub } from 'graphql-subscriptions';
import EventEmitter from 'events';

// Allow subscriptions to have 30 connections
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(30);

export enum PUBSUB_CHANNEL {
    DISPLAY = 'DISPLAY',
    INFO = 'INFO',
    NOTIFICATION = 'NOTIFICATION',
    OWNER = 'OWNER',
    SERVERS = 'SERVERS',

}

export const pubsub = new PubSub({ eventEmitter });
