import WebSocket from 'ws';
import WebSocketAsPromised from 'websocket-as-promised';
import { graphql } from 'graphql';
import { print } from 'graphql/language/printer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { MOTHERSHIP_RELAY_WS_LINK } from '../consts';
import { debounce } from './debounce';
import { log } from '../core/log';
import { types as typeDefs } from '../graphql/types';
import * as resolvers from '../graphql/resolvers';
import { apiManager } from '../core/api-manager';
import { varState } from '../core/states/var';
import { version } from '../../package.json';
import { pubsub } from '../core/pubsub';
import { mothership } from './subscribe-to-servers';

let relay: (WebSocketAsPromised & { _ws?: WebSocket }) | undefined;
let timeout: number | undefined;

const subscriptionListener = (id: string | number, name: string) => (data: any) => {
	if (relay?.isOpened) {
		relay.send(JSON.stringify({
			id,
			payload: {
				data: {
					[name]: data
				}
			},
			type: 'data'
		}));
	}
};

const readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
const getConnectionStatus = () => readyStates[relay?._ws?.readyState ?? 3];

// Ensure API key exists and is valid
const checkApiKey = async () => {
	const apiKey = apiManager.getKey('my_servers')?.key;
	if (!apiKey) {
		return false;
	}

	if (apiKey.length < 64) {
		return false;
	}

	return true;
};

// Ensure we should actually be connected right now
// If our API key exists and is the right length then we should always try to connect
const shouldBeConnected = async () => checkApiKey();

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

const schema = makeExecutableSchema({
	typeDefs,
	resolvers
});

const handleError = (error: unknown) => {
	const reason = (error as any).reason as string;
	const code = (error as any).code as number ?? 500;
	switch (code) {
		case 401:
			// Bail as the key is invalid and we need a valid one to connect
			log.debug('DISCONNECTED:401:INVALID_API_KEY');
			break;

		case 426:
			// Bail as we cannot reconnect
			log.debug('DISCONNECTED:426:API_IS_TOO_OUTDATED');
			break;

		case 429:
			// Reconnect after 30s
			log.debug(`DISCONNECTED:429:${reason ?? 'API_KEY_IN_USE'}`);
			timeout = Date.now() + 30_000;
			setTimeout(() => {
				timeout = undefined;
			}, 30_000);
			break;

		case 500:
			// Reconnect after 60s
			log.debug(`DISCONNECTED:500:${reason ?? 'INTERNAL_SERVER_ERROR'}`);
			timeout = Date.now() + 60_000;
			setTimeout(() => {
				timeout = undefined;
			}, 60_000);
			break;

		case 503:
			// Reconnect after 60s
			log.debug(`DISCONNECTED:503:${reason ?? 'GATEWAY_DOWN'}`);
			timeout = Date.now() + 60_000;
			setTimeout(() => {
				timeout = undefined;
			}, 60_000);
			break;

		default:
			// Reconnect after 60s
			log.debug(`DISCONNECTED:${code}:${reason}`);
			timeout = Date.now() + 60_000;
			setTimeout(() => {
				timeout = undefined;
			}, 60_000);
			break;
	}
};

// Check our ws connection is correct
export const checkConnection = debounce(async () => {
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
		if (await shouldBeConnected() && relay?.isOpened) {
			return;
		}

		// Close the connection if it's still up
		if (relay) {
			const oldRelay = relay;
			relay = undefined;
			await oldRelay.close();
		}

		// If we should be disconnected at this point then stay that way
		if (!await shouldBeConnected()) {
			return;
		}

		const headers = getRelayHeaders();

		log.debug('Connecting to %s', MOTHERSHIP_RELAY_WS_LINK);
		log.silly('Headers: %s', JSON.stringify(headers, null, 2));

		// Create a new ws instance
		relay = new WebSocketAsPromised(MOTHERSHIP_RELAY_WS_LINK, {
			createWebSocket: url => new WebSocket(url, ['mothership-0.0.1'], {
				headers
			}) as any,
			extractMessageData: event => JSON.parse(event)
		});

		// Connect to relay
		await relay.open();

		// Connect to /graphql
		mothership.connect();

		// Bind on disconnect handler
		relay.onClose.addListener(statusCode => {
			// Close connection to /graphql
			mothership.close();

			const after = getConnectionStatus();
			log.debug('Websocket connection changed %s with statusCode %s', after, statusCode);
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
						log.debug('Processing %s', operationName);
						log.silly(query);

						// Process query
						const payload = await graphql({
							schema,
							source: query
						});

						log.silly(payload);

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
						log.debug('Subscribing to %s', name);
						const subId = await pubsub.subscribe(name, subscriptionListener(id, name));

						// When this ws closes remove the listener
						relay.onClose.addOnceListener(() => {
							log.debug('Unsubscribing from %s as the socket closed', name);
							pubsub.unsubscribe(subId);
						});
						break;
					}

					default:
						break;
				}
			} catch (error: unknown) {
				log.error('%s', error);
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
		if (before !== after) {
			log.info('%s -> %s', before, after);
		} else if (timeout) {
			log.info('Reconnecting in %ss!', Math.floor((timeout - Date.now()) / 1_000));
		} else {
			log.info('OK!');
		}
	}
}, 5_000);
