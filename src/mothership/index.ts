import WebSocket from 'ws';
import WebSocketAsPromised from 'websocket-as-promised';
import { createStream as createRotatingFileStream, RotatingFileStream } from 'rotating-file-stream';
import { graphql } from 'graphql';
import { print } from 'graphql/language/printer';
import { MOTHERSHIP_RELAY_WS_LINK } from '@app/consts';
import { debounce } from '@app/mothership/debounce';
import { logger, relayLogger } from '@app/core/log';
import { apiManager } from '@app/core/api-manager';
import { varState } from '@app/core/states/var';
import { pubsub } from '@app/core/pubsub';
import { checkGraphqlConnection } from '@app/mothership/subscribe-to-servers';
import { apiKeyToUser } from '@app/graphql';
import { schema } from '@app/graphql/schema';
import { shouldBeConnectedToCloud, wsState } from '@app/mothership/should-be-connect-to-cloud';
import { clearValidKeyCache } from '@app/core/utils/misc/validate-api-key';
import { getRelayConnectionStatus } from '@app/mothership/get-relay-connection-status';
import { relayStore } from '@app/mothership/store';
import { startDashboardProducer, stopDashboardProducer } from '@app/graphql/resolvers/subscription/dashboard';
import { version } from '@app/../package.json';

const convertToFuzzyTime = (min: number, max: number): number => Math.floor((Math.random() * (max - min + 1)) + min);

let outgoingStream: RotatingFileStream;
const saveOutgoingWebsocketMessageToDisk = (message: string) => {
	// Start stream if it doesn't exist
	if (!outgoingStream) {
		outgoingStream = createRotatingFileStream('/var/log/unraid-api/relay-outgoing-messages.log', {
			size: '10M', // Rotate every 10 MegaBytes written
			interval: '1d', // Rotate daily
			compress: 'gzip', // Compress rotated files
			maxFiles: parseInt(process.env.LOG_MOTHERSHIP_MESSAGES_MAX_FILES ?? '2', 10), // Keep a maximum of 2 log files
		});
	}

	outgoingStream.write(`[${new Date().toISOString()}] ${message}\n`);
};

let incomingStream: RotatingFileStream;
const saveIncomingWebsocketMessageToDisk = (message: string) => {
	// Start stream if it doesn't exist
	if (!incomingStream) {
		incomingStream = createRotatingFileStream('/var/log/unraid-api/relay-incoming-messages.log', {
			size: '10M', // Rotate every 10 MegaBytes written
			interval: '1d', // Rotate daily
			compress: 'gzip', // Compress rotated files
			maxFiles: parseInt(process.env.LOG_MOTHERSHIP_MESSAGES_MAX_FILES ?? '2', 10), // Keep a maximum of 2 log files
		});
	}

	incomingStream.write(`[${new Date().toISOString()}] ${message}\n`);
};

/**
 * Send a message to relay if it's open
 * @param type ka = keep-alive, error or data
 */
function sendMessage(name: string, type: 'ka');
function sendMessage(name: string, type: 'error', id: string | number, payload: { error: Record<string, unknown> });
function sendMessage(name: string, type: 'data', id: string | number, payload: { data: Record<string, unknown> });
function sendMessage(name: string, type: string, id?: unknown, payload?: Record<string, unknown>): void {
	if (!relayStore.relay?.isOpened) return;
	const data = {
		id,
		payload,
		type,
	};
	const message = JSON.stringify(data);

	// Log the message
	if (type === 'ka') {
		relayLogger.trace('Sending keep-alive message');
	} else {
		relayLogger.addContext('message', message);
		relayLogger.trace('Sending update to subscription %s for %s', id, name);
		relayLogger.removeContext('message');
	}

	// Log all messages
	if (process.env.LOG_MOTHERSHIP_MESSAGES) saveOutgoingWebsocketMessageToDisk(JSON.stringify({ name, data }));

	relayStore.relay.send(message);
}

const subscriptionCache: Record<string, unknown> = {};
const subscriptionListener = (id: string | number, name: string) => (data: unknown) => {
	relayLogger.trace('Got message from listener for %s', name);

	// Bail as we've already sent mothership a message exactly like this
	if (subscriptionCache[name] === data) return;

	// Update the subscription cache
	if (subscriptionCache[name] === undefined) subscriptionCache[name] = data;

	switch (true) {
		// Array needs dampening as it generates too many events during intense IO
		case name === 'array':
			debounce(sendMessage(name, 'data', id, { data } as { data: Record<string, unknown> }), 1_000);
			break;
		default:
			sendMessage(name, 'data', id, { data } as { data: Record<string, unknown> });
			break;
	}
};

const getRelayHeaders = () => {
	const apiKey = apiManager.cloudKey!;
	const serverName = `${varState.data.name}`;

	return {
		'x-api-key': apiKey,
		'x-flash-guid': varState.data?.flashGuid,
		'x-server-name': serverName,
		'x-unraid-api-version': version,
	};
};

const handleReconnection = (reason: string, code: number): { reason: string; timeout?: number } => {
	switch (code) {
		// Client disconnected
		case 5:
			// Bail as the API has disconnected itself
			return { reason: 'API disconnected itself', timeout: convertToFuzzyTime(10_000, 60_000) };

		// Client disconnected
		case 6:
			// Bail as the API has disconnected itself
			return { reason: 'API disconnected itself', timeout: convertToFuzzyTime(10_000, 60_000) };

		// Relay is updating
		case 12:
			return { reason: 'Relay is restarting', timeout: convertToFuzzyTime(10_000, 60_000) };

		case 401:
			// Bail as the key is invalid and we need a valid one to connect
			// Tell api manager to delete the key as it's invalid
			apiManager.expire('my_servers');
			return { reason: 'API key is invalid' };

		case 426:
			// Bail as we cannot reconnect
			wsState.outOfDate = true;
			return { reason: 'API is out of date' };

		case 429: {
			// Reconnect after ~30s
			return { reason: 'You are rate limited', timeout: convertToFuzzyTime(15_000, 45_000) };
		}

		case 500: {
			// Reconnect after ~60s
			return { reason: 'Relay returned a 500 error', timeout: convertToFuzzyTime(45_000, 75_000) };
		}

		case 503: {
			// Reconnect after ~60s
			return { reason: 'Relay is unreachable', timeout: convertToFuzzyTime(45_000, 75_000) };
		}

		default: {
			// Reconnect after ~60s
			return { reason: reason || 'unknown', timeout: convertToFuzzyTime(45_000, 75_000) };
		}
	}
};

const handleError = (error: unknown) => {
	const reason = (error as any).reason as string;
	const code = (error as any).code as number ?? 500;
	const { timeout, reason: reconnectionReason } = handleReconnection(reason, code);
	relayStore.reason = reconnectionReason;
	relayStore.code = code;

	relayLogger.debug('Disconnected with status="%s" reason="%s"', code, reconnectionReason);
	if (!timeout) return;

	relayStore.timeout = Date.now() + timeout;
	setTimeout(() => {
		relayStore.timeout = undefined;
		relayStore.reason = undefined;
		relayStore.code = undefined;
	}, timeout);
};

let interval: NodeJS.Timer;
const startKeepAlive = () => {
	// If we had an old timer running make sure to clear it
	if (interval) clearInterval(interval);

	interval = setInterval(() => {
		// If we disconnect stop sending keep alive messages
		if (!relayStore.relay?.isOpened) {
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
	type: 'query' | 'mutation' | 'start' | 'stop';
	payload: any;
}

const messageIdLookup = new Map<string, { subId: number; field: string }>();

// Check our relay connection is correct
export const checkRelayConnection = debounce(async () => {
	const before = getRelayConnectionStatus();
	try {
		// Bail if we're in the middle of opening a connection
		if (relayStore.relay?.isOpening) {
			return false;
		}

		// Bail if we're waiting on a store.timeout for reconnection
		if (relayStore.timeout) {
			return false;
		}

		// Bail if we're already connected
		if (await shouldBeConnectedToCloud() && relayStore.relay?.isOpened) {
			return false;
		}

		// Close the connection if it's still up
		if (relayStore.relay) {
			const oldRelay = relayStore.relay;
			relayStore.relay = undefined;
			await oldRelay.close();
		}

		// If we should be disconnected at this point then stay that way
		if (!await shouldBeConnectedToCloud()) {
			return false;
		}

		const headers = getRelayHeaders();

		relayLogger.addContext('headers', headers);
		relayLogger.debug('Connecting to %s', MOTHERSHIP_RELAY_WS_LINK);
		relayLogger.removeContext('headers');

		// Create a new ws instance
		relayStore.relay = new WebSocketAsPromised(MOTHERSHIP_RELAY_WS_LINK, {
			createWebSocket: url => new WebSocket(url, ['mothership-0.0.1'], {
				headers,
			}) as unknown as globalThis.WebSocket,
			extractMessageData: event => JSON.parse(event) as unknown,
		});

		// Connect to relay
		await relayStore.relay.open();

		// Start keep alive loop
		startKeepAlive();

		// Bind on disconnect handler
		relayStore.relay.onClose.addListener((statusCode: number, reason: string) => {
			const after = getRelayConnectionStatus();
			relayLogger.debug('Websocket status="%s" statusCode="%s" reason="%s"', after, statusCode, reason);
			const error = new Error();
			const code = `${statusCode}`.substring(1);
			// @ts-expect-error Property 'code' does not exist on type 'Error'.
			error.code = Number(code);
			// @ts-expect-error Property 'reason' does not exist on type 'Error'.
			error.reason = reason;
			handleError(error);

			// Stop the dashboard producer
			stopDashboardProducer();

			// Stop all the pubsub subscriptions as the client closed the connection
			[...messageIdLookup.entries()].forEach(([_messageId, { subId, field }]) => {
				// Un-sub from the pubsub interface
				try {
					relayLogger.debug('Stopping subscription to "%s" as the client sent a "stop" message', field);
					pubsub.unsubscribe(subId);
				} catch (error: unknown) {
					if (!(error instanceof Error)) throw new Error('Unknown error');
					relayLogger.error('Failed stopping subscription id=%s with "%s"', subId, error.message);
				}
			});
		});

		// Bind on message handler
		relayStore.relay.onMessage.addListener(async (message: Message) => {
			const { id, type } = message ?? {};
			try {
				// Log all messages
				if (process.env.LOG_MOTHERSHIP_MESSAGES) saveIncomingWebsocketMessageToDisk(JSON.stringify(message));

				switch (true) {
					case type === 'query' || type === 'mutation': {
						const operationName = message.payload.query.definitions[0].name.value as string;

						// Convert query to string
						const query = print(message.payload.query);
						relayLogger.addContext('query', query);
						relayLogger.debug('Processing %s', operationName);
						relayLogger.removeContext('query');

						// Process query
						const apiKey = apiManager.cloudKey;
						if (!apiKey) throw new Error('No API key found for my_servers');

						const user = await apiKeyToUser(apiKey);
						const result = await graphql({
							schema,
							source: query,
							contextValue: {
								user,
							},
						});

						relayLogger.addContext('result', result);
						relayLogger.trace('Sending reply for %s', operationName);
						relayLogger.removeContext('result');

						// If the socket closed before we could reply then just bail
						if (!relayStore.relay?.isOpened) {
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
						if (!relayStore.relay?.isOpened) {
							return;
						}

						// Find which field we're subscribing to
						// Since subscriptions can only include a single field it's safe to assume 0 is the correct index
						const field = message.payload.query.definitions[0].selectionSet.selections[0].name.value as string;

						// Subscribe to endpoint
						relayLogger.debug('Starting subscription to %s', field);
						const subId = await pubsub.subscribe(field, subscriptionListener(id, field));

						// Save the subId and field for later
						messageIdLookup.set(id, { subId, field });

						// If this is the dashboard endpoint it also needs its producer started
						if (field === 'dashboard') {
							// Start producer
							startDashboardProducer();
						}

						break;
					}

					case type === 'stop': {
						const { field, subId } = messageIdLookup.get(id) ?? {};
						if (!field || !subId) {
							relayLogger.error('Failed to unsubscribe from %s as there was no known field or subId associated', id);
							return;
						}

						// Remove the subId, etc. so when the socket is closed
						// it doesn't unsub from subscriptions that are already stopped
						messageIdLookup.delete(id);

						// Un-sub this socket from the pubsub interface
						try {
							relayLogger.debug('Stopping subscription to "%s" as the client sent a "stop" message', field);
							pubsub.unsubscribe(subId);
						} catch (error: unknown) {
							if (!(error instanceof Error)) throw new Error('Unknown error');
							relayLogger.error('Failed stopping subscription id=%s with "%s"', subId, error.message);
						}

						// If this is the dashboard endpoint it also needs its producer stopped
						if (field === 'dashboard') {
							// Stop producer
							stopDashboardProducer();
						}

						break;
					}

					default:
						relayLogger.error('Unknown message type "%s"', type);
						break;
				}
			} catch (error: unknown) {
				if (!(error instanceof Error)) throw new Error(`Unknown Error "${error as string}"`);
				relayLogger.error('Failed processing message with "%s"', error.message);
				const operationName = message.payload.query.definitions[0].name.value as string;
				sendMessage(operationName, 'error', id, {
					error: {
						message: error.message,
					},
				});
			}
		});

		return true;
	} catch (error: unknown) {
		handleError(error);
		return false;
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
					relayLogger.info('Connection status changed from %s to %s', before, after);
					relayLogger.removeContext('url');
				}

				break;
		}

		if (relayStore.timeout) {
			const secondsLeft = Math.floor((relayStore.timeout - Date.now()) / 1_000);
			relayLogger.debug('Reconnecting in %ss', secondsLeft);
		}
	}
}, 5_000);

export const checkCloudConnections = async () => {
	logger.trace('Checking cloud connections');

	const relayConnected = await checkRelayConnection();
	if (relayConnected) await checkGraphqlConnection();
};
