import { graphqlLogger } from './core/log';

interface subscription {
	total: number;
	channels: string[];
}

const subscriptions: Record<string, subscription> = {};

/**
 * Return current ws connection count.
 */
export const getWsConnectionCount = () => {
	return Object.values(subscriptions).filter(subscription => subscription.total >= 1).length;
};

/**
 * Return current ws connection count in channel.
 */
export const getWsConnectionCountInChannel = (channel: string) => {
	return Object.values(subscriptions).filter(subscription => subscription.channels.includes(channel)).length;
};

export const hasSubscribedToChannel = (id: string, channel: string) => {
	graphqlLogger.debug('Subscribing to %s', channel);

	// Setup initial object
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
	// Setup initial object
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
 */
export const wsHasConnected = (id: string) => {
	subscriptions[id] = {
		total: 0,
		channels: []
	};
};

/**
 * Websocket has disconnected.
 */
export const wsHasDisconnected = (id: string) => {
	subscriptions[id].total = 0;
	subscriptions[id].channels = [];
};
