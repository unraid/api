import core from '@unraid/core';

const { log } = core;

let connectionCount = 0;
const channelSubscriptions = {};
const wsSubscriptions = {};

/**
 * Return current ws connection count.
 */
export const getWsConectionCount = () => connectionCount;

/**
 * Return current ws connection count in channel.
 */
export const getWsConectionCountInChannel = (channel: string) => {
    return channelSubscriptions[channel].total;
};

/**
 * Increase ws connection count by 1.
 */
export const increaseWsConectionCount = () => {
    connectionCount++;
    return connectionCount;
};

/**
 * Decrease ws connection count by 1.
 */
export const decreaseWsConectionCount = () => {
    connectionCount--;
    return connectionCount;
};

export const hasSubscribedToChannel = (id: string, channel: string) => {
    // Total ws connections per channel
    if (!channelSubscriptions[channel]) {
        channelSubscriptions[channel] = {
            total: 0
        };
    }
    channelSubscriptions[channel].total++;

    // All subscriptions for this websocket
    if (!wsSubscriptions[id]) {
        wsSubscriptions[id] = [channel];
    }
    wsSubscriptions[id] = [
        ...wsSubscriptions[id],
        channel
    ];
};

export const hasUnsubscribedFromChannel = (id: string, channel: string) => {
    channelSubscriptions[channel].total--;
    wsSubscriptions[id] = wsSubscriptions[id].filter(existingChannel => existingChannel !== channel);
};

/**
 * Websocket has connected.
 *
 * @param ws
 */
export const wsHasConnected = () => {
    increaseWsConectionCount();
};

/**
 * Websocket has disconnected.
 *
 * @param ws
 */
export const wsHasDisconnected = (id: string) => {
    decreaseWsConectionCount();

    // Update the total for each channel
    wsSubscriptions[id].forEach((channel: string) => {
        hasUnsubscribedFromChannel(id, channel);
    });
};

// Only allows function to publish to pubsub when clients are online and are connected to the specific channel
// the reason we do this is otherwise pubsub will cause a memory leak
export const canPublishToChannel = (channel: string) => {
    // No ws connections
    if (getWsConectionCount() === 0) {
        return false;
    }

    // No ws connections to this channel
    const channelConnectionCount = getWsConectionCountInChannel(channel);
    if (channelConnectionCount === 0) {
        return false;
    }

    const plural = channelConnectionCount !== 1;
    log.debug(`Allowing publish to "${channel}" as there ${plural ? 'are' : 'is'} ${channelConnectionCount} connection ${plural ? 's' : ''} in that channel.`);
    return true;
};