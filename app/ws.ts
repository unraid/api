import { log } from '@unraid/core';

interface subscription {
    total: number
    channels: string[]
}

const subscriptions: {
    [key: string]: subscription
} = {};

/**
 * Return current ws connection count.
 */
export const getWsConectionCount = () => {
    return Object.values(subscriptions).filter(subscription => subscription.total >= 1).length;
};

/**
 * Return current ws connection count in channel.
 */
export const getWsConectionCountInChannel = (channel: string) => {
    return Object.values(subscriptions).filter(subscription => subscription.channels.includes(channel)).length;
};

export const hasSubscribedToChannel = (id: string, channel: string) => {
    // Setup inital object
    if (subscriptions[id] === undefined) {
        subscriptions[id] = {
            total: 1,
            channels: [channel]
        };
        return;
    }
    subscriptions[id].total++;
    subscriptions[id].channels.push(channel);
};

export const hasUnsubscribedFromChannel = (id: string, channel: string) => {
    // Setup inital object
    if (subscriptions[id] === undefined) {
        subscriptions[id] = {
            total: 0,
            channels: []
        };
        return;
    }
    subscriptions[id].total--;
    subscriptions[id].channels = subscriptions[id].channels.filter(existingChannel => existingChannel !== channel);
};

/**
 * Websocket has connected.
 *
 * @param ws
 */
export const wsHasConnected = (id: string) => {
    subscriptions[id] = {
        total:  0,
        channels: []
    };
};

/**
 * Websocket has disconnected.
 *
 * @param ws
 */
export const wsHasDisconnected = (id: string) => {
    subscriptions[id].total = 0;
    subscriptions[id].channels = [];
};

// Only allows function to publish to pubsub when clients are online and are connected to the specific channel
// the reason we do this is otherwise pubsub will cause a memory leak
export const canPublishToChannel = (channel: string) => {
    // No ws connections
    if (getWsConectionCount() === 0) {
        // log.debug('No ws connections, cannot publish');
        return false;
    }

    // No ws connections to this channel
    const channelConnectionCount = getWsConectionCountInChannel(channel);
    if (channelConnectionCount === 0) {
        // log.debug(`No connections to channel ${channel}`);
        return false;
    }

    const plural = channelConnectionCount !== 1;
    log.debug(`Allowing publish to "${channel}" as there ${plural ? 'are' : 'is'} ${channelConnectionCount} connection${plural ? 's' : ''} in that channel.`);
    return true;
};