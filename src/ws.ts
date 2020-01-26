import { User } from '@unraid/core/dist/interfaces';

let connectionCount = 0;
const channelSubscriptions = {};
const userSubscriptions = {};

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

export const hasSubscribedToChannel = (user: User, channel: string) => {
    // Total ws connections per channel
    if (!channelSubscriptions[channel]) {
        channelSubscriptions[channel] = {
            total: 0
        };
    }
    channelSubscriptions[channel].total++;

    // All subscriptions for this user
    if (!userSubscriptions[user.id]) {
        userSubscriptions[user.id] = [channel];
    }
    userSubscriptions[user.id] = [
        ...userSubscriptions[user.id],
        channel
    ];
};

export const hasUnsubscribedFromChannel = (user: User, channel: string) => {
    channelSubscriptions[channel].total--;
    userSubscriptions[user.id] = userSubscriptions[user.id].filter(existingChannel => existingChannel !== channel);
};

export const userHasConnected = (user: User) => {
    increaseWsConectionCount();
};

export const userHasDisconnected = (user: User) => {
    decreaseWsConectionCount();

    // Update the total for each channel
    userSubscriptions[user.id].forEach((channel: string) => {
        hasUnsubscribedFromChannel(user, channel);
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
    if (getWsConectionCountInChannel(channel) === 0) {
        return false;
    }

    return true;
};