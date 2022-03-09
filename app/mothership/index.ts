import WebSocket from 'ws';
import WebSocketAsPromised from 'websocket-as-promised';
import { graphql } from 'graphql';
import { print } from 'graphql/language/printer';
import { MOTHERSHIP_RELAY_WS_LINK } from '../consts';
import { debounce } from './debounce';
import { logger, relayLogger } from '../core/log';
import { apiManager } from '../core/api-manager';
import { varState } from '../core/states/var';
import { version } from '../../package.json';
import { pubsub } from '../core/pubsub';
import { checkGraphqlConnection } from './subscribe-to-servers';
import { apiKeyToUser } from '../graphql';
import { schema } from '../graphql/schema';
import { shouldBeConnectedToCloud, wsState } from './should-be-connect-to-cloud';
import { clearValidKeyCache } from '../core/utils/misc/validate-api-key';
import { getRelayConnectionStatus } from './get-relay-connection-status';

let relay: (WebSocketAsPromised & { _ws?: WebSocket }) | undefined;
let timeout: number | undefined;

const convertToFuzzyTime = (min: number, max: number): number => Math.floor((Math.random() * (max - min + 1)) + min);

/**
 * Send a message to relay if it's open
 * @param type ka = keep-alive, error or data
 */
function sendMessage(name: string, type: 'ka');
function sendMessage(name: string, type: 'error', id: string | number, payload: { error: Record<string, unknown> });
function sendMessage(name: string, type: 'data', id: string | number, payload: { data: Record<string, unknown> });
function sendMessage(name: string, type: string, id?: unknown, payload?: Record<string, unknown>): void {
	if (!relay?.isOpened) return;
	const message = JSON.stringify({
		id,
		payload,
		type
	});

	// Log the message
	if (type === 'ka') {
		relayLogger.trace('Sending keep-alive message');
	} else {
		relayLogger.addContext('message', message);
		relayLogger.trace('Sending update to subscription %s for %s', id, name);
		relayLogger.removeContext('message');
	}

	relay.send(message);
}

const subscriptionCache = {};
const subscriptionListener = (id: string | number, name: string) => (data: any) => {
	relayLogger.trace('Got message from listener for %s', name);

	// Bail as we've already sent mothership a message exactly like this
	if (subscriptionCache[name] === data) return;

	// Update the subscription cache
	if (subscriptionCache[name] === undefined) subscriptionCache[name] = data;

	switch (true) {
		// Array needs dampening as it generates too many events during intense IO
		case name === 'array':
			debounce(sendMessage(name, 'data', id, { data }), 1_000);
			break;
		default:
			sendMessage(name, 'data', id, { data });
			break;
	}
};

export const getRelay = () => relay;

const getRelayHeaders = () => {
	const apiKey = apiManager.getKey('my_servers')?.key!;
	const serverName = `${varState.data.name}`;

	return {
		'x-api-key': apiKey,
		'x-flash-guid': varState.data?.flashGuid,
		'x-server-name': serverName,
		'x-unraid-api-version': version
	};
};

const handleError = (error: unknown) => {
	const reason = (error as any).reason as string;
	const code = (error as any).code as number ?? 500;
	relayLogger.debug('Disconnected with status="%s" reason="%s"', code, reason);
	switch (code) {
		case 401:
			// Bail as the key is invalid and we need a valid one to connect
			// Tell api manager to delete the key as it's invalid
			apiManager.expire('my_servers');
			break;

		case 426:
			// Bail as we cannot reconnect
			wsState.outOfDate = true;
			break;

		case 429:
			// Reconnect after ~30s
			timeout = Date.now() + 30_000;
			setTimeout(() => {
				timeout = undefined;
			}, convertToFuzzyTime(15_000, 45_000));
			break;

		case 500:
			// Reconnect after ~60s
			timeout = Date.now() + 60_000;
			setTimeout(() => {
				timeout = undefined;
			}, convertToFuzzyTime(45_000, 75_000));
			break;

		case 503:
			// Reconnect after ~60s
			timeout = Date.now() + 60_000;
			setTimeout(() => {
				timeout = undefined;
			}, convertToFuzzyTime(45_000, 75_000));
			break;

		default:
			// Reconnect after ~60s
			timeout = Date.now() + 60_000;
			setTimeout(() => {
				timeout = undefined;
			}, convertToFuzzyTime(45_000, 75_000));
			break;
	}
};

const startKeepAlive = () => {
	const interval = setInterval(() => {
		// If we disconnect stop sending keep alive messages
		if (!relay?.isOpened) {
			clearInterval(interval);
			return;
		}

		// Send keep alive message
		relayLogger.trace('Sending keep alive message');
		sendMessage('ka', 'ka');
	}, 30_000);
};

interface Message {
	id: string;
	type: 'query' | 'mutation' | 'start';
	payload: any;
}

// Check our relay connection is correct
export const checkRelayConnection = debounce(async () => {
	const before = getRelayConnectionStatus();
	try {
		// Bail if we're in the middle of opening a connection
		if (relay?.isOpening) {
			return;
		}

		// Bail if we're waiting on a timeout for reconnection
		if (timeout) {
			return;
		}

		// Bail if we're already connected
		if (await shouldBeConnectedToCloud() && relay?.isOpened) {
			return;
		}

		// Close the connection if it's still up
		if (relay) {
			const oldRelay = relay;
			relay = undefined;
			await oldRelay.close();
		}

		// If we should be disconnected at this point then stay that way
		if (!await shouldBeConnectedToCloud()) {
			return;
		}

		const headers = getRelayHeaders();

		relayLogger.addContext('headers', headers);
		relayLogger.debug('Connecting to %s', MOTHERSHIP_RELAY_WS_LINK);
		relayLogger.removeContext('headers');

		// Create a new ws instance
		relay = new WebSocketAsPromised(MOTHERSHIP_RELAY_WS_LINK, {
			createWebSocket: url => new WebSocket(url, ['mothership-0.0.1'], {
				headers
			}) as any,
			extractMessageData: event => JSON.parse(event)
		});

		// Connect to relay
		await relay.open();

		// Start keep alive loop
		startKeepAlive();

		// Bind on disconnect handler
		relay.onClose.addListener((statusCode: number, reason: string) => {
			const after = getRelayConnectionStatus();
			relayLogger.debug('Websocket status="%s" statusCode="%s" reason="%s"', after, statusCode, reason);
			const error = new Error();
			const code = `${statusCode}`.substring(1);
			// @ts-expect-error
			error.code = Number(code);
			// @ts-expect-error
			error.reason = reason;
			handleError(error);
		});

		// Bind on message handler
		relay.onMessage.addListener(async (message: Message) => {
			const { id, type } = message ?? {};
			const operationName = message.payload.query.definitions[0].name.value;
			try {
				switch (true) {
					case type === 'query' || type === 'mutation': {
						// Convert query to string
						const query = print(message.payload.query);
						relayLogger.addContext('query', query);
						relayLogger.debug('Processing %s', operationName);
						relayLogger.removeContext('query');

						// Process query
						const apiKey = apiManager.getKey('my_servers')?.key!;
						const user = await apiKeyToUser(apiKey);
						const result = await graphql({
							schema,
							source: query,
							contextValue: {
								user
							}
						});

						relayLogger.addContext('result', result);
						relayLogger.trace('Sending reply for %s', operationName);
						relayLogger.removeContext('result');

						// If the socket closed before we could reply then just bail
						if (!relay?.isOpened) {
							// Log we can't reply
							relayLogger.trace('Failed sending reply for %s as the connection to relay is closed.', operationName);
							return;
						}

						// Reply back with data
						sendMessage(operationName, 'data', id, result as any);

						// Log we sent a reply
						relayLogger.trace('Sent reply for %s', operationName);
						break;
					}

					case type === 'start': {
						// If the socket closed before we could reply then just bail
						if (!relay?.isOpened) {
							return;
						}

						// Find which field we're subscribing to
						// Since subscriptions can only include a single field it's safe to assume 0 is the correct index
						const name = message.payload.query.definitions[0].selectionSet.selections[0].name.value;

						// Subscribe to endpoint
						relayLogger.debug('Subscribing to %s', name);
						const subId = await pubsub.subscribe(name, subscriptionListener(id, name));

						// When this ws closes remove the listener
						relay.onClose.addOnceListener(() => {
							relayLogger.debug('Unsubscribing from %s as the socket closed', name);
							pubsub.unsubscribe(subId);
						});
						break;
					}

					default:
						break;
				}
			} catch (error: unknown) {
				relayLogger.addContext('error', error);
				relayLogger.error('Failed processing message');
				relayLogger.removeContext('error');
				sendMessage(operationName, 'error', id, {
					error: {
						message: error instanceof Error ? error.message : error
					}
				});
			}
		});
	} catch (error: unknown) {
		handleError(error);
	} finally {
		const after = getRelayConnectionStatus();

		switch (true) {
			case before === 'CLOSED' && after === 'OPEN':
				relayLogger.info('Connected to %s', MOTHERSHIP_RELAY_WS_LINK);
				break;
			case before === 'OPEN' && after === 'CLOSED':
				relayLogger.info('Disconnected from %s', MOTHERSHIP_RELAY_WS_LINK);
				// Clear all the valid keys from memory
				// This will cause key-server to be hit before we reconnect which is good
				// This will prevent users with invalid keys even attempting to connect
				clearValidKeyCache();
				break;
			default:
				if (before !== after) {
					relayLogger.addContext('url', MOTHERSHIP_RELAY_WS_LINK);
					relayLogger.info('Connection status changed from %s to %s');
					relayLogger.removeContext('url');
				}

				break;
		}

		if (timeout) {
			const secondsLeft = Math.floor((timeout - Date.now()) / 1_000);
			relayLogger.debug('Reconnecting in %ss', secondsLeft);
		}
	}
}, 5_000);

export const checkCloudConnections = async () => {
	logger.trace('Checking cloud connections');

	return Promise.all([
		checkRelayConnection(),
		checkGraphqlConnection()
	]);
};
