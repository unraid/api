import WebSocket from 'ws';
import WebSocketAsPromised from 'websocket-as-promised';
import { graphql } from 'graphql';
import { print } from 'graphql/language/printer';
import { MOTHERSHIP_RELAY_WS_LINK } from '@app/consts';
import { debounce } from '@app/mothership/debounce';
import { logger, relayLogger } from '@app/core/log';
import { apiManager } from '@app/core/api-manager';
import { pubsub } from '@app/core/pubsub';
import { apiKeyToUser } from '@app/graphql';
import { schema } from '@app/graphql/schema';
import { shouldBeConnectedToCloud } from '@app/mothership/should-be-connect-to-cloud';
import { clearValidKeyCache } from '@app/core/utils/misc/validate-api-key';
import { getRelayConnectionStatus } from '@app/mothership/get-relay-connection-status';
import { relayStore } from '@app/mothership/store';
import { startDashboardProducer, stopDashboardProducer } from '@app/graphql/resolvers/subscription/dashboard';
import { getRelayHeaders } from '@app/mothership/utils/get-relay-headers';
import { RelayKeepAlive } from '@app/mothership/jobs/relay-keep-alive-jobs';
import { handleError } from '@app/mothership/handle-error';
import { saveIncomingWebsocketMessageToDisk } from '@app/mothership/save-websocket-message-to-disk';
import { sendMessage } from '@app/mothership/send-message';
import { subscriptionListener } from '@app/mothership/subscription-listener';

const messageIdLookup = new Map<string, { subId: number; field: string }>();

interface Message {
	id: string;
	type: 'query' | 'mutation' | 'start' | 'stop';
	payload: any;
}

// Check our relay connection is correct
export const checkRelayConnection = debounce(async () => {
	const before = getRelayConnectionStatus();
	try {
		// Bail if we're in the middle of opening a connection
		if (relayStore.relay?.isOpening) {
			relayLogger.trace('[Check-Connected] - RelayStore isOpening, returning false')
			return false;
		}

		// Bail if we're waiting on a store.timeout for reconnection
		if (relayStore.timeout) {
			relayLogger.trace('[Check-Connected] - RelayStore timeout, returning false')

			return false;
		}

		// Bail if we're already connected
		if (await shouldBeConnectedToCloud() && relayStore.relay?.isOpened) {
			relayLogger.trace('[Check-Connected] - Already connected to cloud, bailing on reconnect attempt')
			return true;
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
		RelayKeepAlive.init();

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
