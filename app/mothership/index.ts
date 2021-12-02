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
import { shouldBeConnectedToCloud } from './should-be-connect-to-cloud';

let relay: (WebSocketAsPromised & { _ws?: WebSocket }) | undefined;
let timeout: number | undefined;

const subscriptionListener = (id: string | number, name: string) => (data: any) => {
	relayLogger.trace('Sending update for %s for subscription %s', name, id);
	if (relay?.isOpened) {
		relay.send(JSON.stringify({
			id,
			payload: {
				data
			},
			type: 'data'
		}));
	}
};

const readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
const getConnectionStatus = () => readyStates[relay?._ws?.readyState ?? 3];

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
	relayLogger.addContext('reason', reason);
	relayLogger.addContext('code', code);
	relayLogger.debug('Disconnected');
	switch (code) {
		case 401:
			// Bail as the key is invalid and we need a valid one to connect
			break;

		case 426:
			// Bail as we cannot reconnect
			break;

		case 429:
			// Reconnect after 30s
			timeout = Date.now() + 30_000;
			setTimeout(() => {
				timeout = undefined;
			}, 30_000);
			break;

		case 500:
			// Reconnect after 60s
			timeout = Date.now() + 60_000;
			setTimeout(() => {
				timeout = undefined;
			}, 60_000);
			break;

		case 503:
			// Reconnect after 60s
			timeout = Date.now() + 60_000;
			setTimeout(() => {
				timeout = undefined;
			}, 60_000);
			break;

		default:
			// Reconnect after 60s
			timeout = Date.now() + 60_000;
			setTimeout(() => {
				timeout = undefined;
			}, 60_000);
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
		relay.send(JSON.stringify({ type: 'ka' }));
	}, 30_000);
};

// Check our relay connection is correct
export const checkRelayConnection = debounce(async () => {
	const before = getConnectionStatus();
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

		relayLogger.debug('Connecting to %s', MOTHERSHIP_RELAY_WS_LINK);
		relayLogger.trace('Headers: %s', JSON.stringify(headers, null, 2));

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
		relay.onClose.addListener(statusCode => {
			const after = getConnectionStatus();
			relayLogger.debug('Websocket connection changed %s with statusCode %s', after, statusCode);
		});

		// Bind on message handler
		relay.onMessage.addListener(async message => {
			const { id, type } = message ?? {};
			const operationName = message.payload.query.definitions[0].name.value;
			try {
				switch (true) {
					case type === 'query' || type === 'mutation' || operationName === 'getInitialData': {
						// Convert query to string
						const query = print(message.payload.query);
						relayLogger.debug('Processing %s', operationName);
						relayLogger.trace(query);

						// Process query
						const apiKey = apiManager.getKey('my_servers')?.key!;
						const user = await apiKeyToUser(apiKey);
						const payload = await graphql({
							schema,
							source: query,
							contextValue: {
								user
							}
						});

						relayLogger.trace(payload);

						// If the socket closed before we could reply then just bail
						if (!relay?.isOpened) {
							return;
						}

						// Send data
						relay.send(JSON.stringify({
							id,
							payload,
							type: 'data'
						}));
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
				if (relay?.isOpened) {
					relay.send(JSON.stringify({
						id,
						payload: {
							error: {
								message: error instanceof Error ? error.message : error
							}
						}
					}));
				}
			}
		});
	} catch (error: unknown) {
		handleError(error);
	} finally {
		const after = getConnectionStatus();

		switch (true) {
			case before === 'CLOSED' && after === 'OPEN':
				relayLogger.info('Connected to %s', MOTHERSHIP_RELAY_WS_LINK);
				break;
			case before === 'OPEN' && after === 'CLOSED':
				relayLogger.info('Disconnected from %s', MOTHERSHIP_RELAY_WS_LINK);
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
