import fs from 'fs';
import WebSocket from 'ws';
import * as Sentry from '@sentry/node';
import { utils, paths, states, log } from '@unraid/core';
import { DynamixConfig } from '@unraid/core/dist/lib/types';
import { MOTHERSHIP_RELAY_WS_LINK, INTERNAL_WS_LINK, ONE_MINUTE } from '../consts';
import { subscribeToServers } from './subscribe-to-servers';

const { loadState, sleep } = utils;
const { varState } = states;

// Websocket closed state
// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
const CLOSED_READY_STATE = 3;

/**
 * Get a number between the lowest and highest value.
 * @param low Lowest value.
 * @param high Highest value.
 */
const getNumberBetween = (low: number, high: number) => Math.floor(Math.random() * (high - low + 1) + low);

/**
 * Create a jitter of +/- 20%.
 */
const applyJitter = (value: number) => {
	const jitter = getNumberBetween(80, 120) / 100;
	return Math.floor(value * jitter);
};

const backoff = (attempt: number, maxDelay: number, multiplier: number) => {
	const delay = applyJitter((Math.pow(2.0, attempt) - 1.0) * 0.5);
	return Math.round(Math.min(delay * multiplier, maxDelay));
};

let relay: WebSocket;

interface WebSocketWithHeartBeat extends WebSocket {
	pingTimeout?: NodeJS.Timeout
}

function heartbeat(this: WebSocketWithHeartBeat) {
	if (this.pingTimeout) {
		clearTimeout(this.pingTimeout);
	}

	// Use `WebSocket#terminate()`, which immediately destroys the connection,
	// instead of `WebSocket#close()`, which waits for the close timer.
	// Delay should be equal to the interval at which your server
	// sends out pings plus a conservative assumption of the latency.
	this.pingTimeout = setTimeout(() => {
		this.terminate();
	}, 30000 + 1000);
};

const readFileIfExists = (filePath: string) => {
	try {
		return fs.readFileSync(filePath);
	} catch {}

	return Buffer.from('');
};

/**
 * Connect to unraid's proxy server
 */
export const connectToMothership = async (wsServer: WebSocket.Server, currentRetryAttempt: number = 0) => {
	// Kill any existing connection before we proceed
	if (relay) {
		await disconnectFromMothership();
	}

	let retryAttempt = currentRetryAttempt;
	if (retryAttempt >= 1) {
		log.debug(`Reconnecting to mothership, attempt ${retryAttempt}.`);
	}

	const apiKey = loadState<DynamixConfig>(paths.get('dynamix-config')!).remote.apikey || '';
	const keyFile = varState.data?.regFile ? readFileIfExists(varState.data?.regFile).toString('base64') : '';
	const serverName = `${varState.data?.name}`;
	const lanIp = states.networkState.data.find(network => network.ipaddr[0]).ipaddr[0] || '';
	const machineId = `${await utils.getMachineId()}`;
	let localGraphqlApi: WebSocket;
	let mothershipServersEndpoint: {
		unsubscribe: () => void;
	};

	// Connect to mothership's relay endpoint
	// Keep reference outside this scope so we can disconnect later
	relay = new WebSocket(MOTHERSHIP_RELAY_WS_LINK, ['graphql-ws'], {
		headers: {
			'x-api-key': apiKey,
			'x-flash-guid': varState.data?.flashGuid ?? '',
			'x-key-file': keyFile ?? '',
			'x-server-name': serverName,
			'x-lan-ip': lanIp,
			'x-machine-id': machineId
		}
	});

	relay.on('open', async () => {
		log.debug(`Connected to mothership's relay via ${MOTHERSHIP_RELAY_WS_LINK}.`);

		// Reset retry attempts
		retryAttempt = 0;

		// Connect to the internal graphql server
		localGraphqlApi = new WebSocket(INTERNAL_WS_LINK, ['graphql-ws']);

		// Heartbeat
		localGraphqlApi.on('ping', () => {
			heartbeat.bind(localGraphqlApi)();
		});

		// Errors
		localGraphqlApi.on('error', error => {
            Sentry.captureException(error);
			log.error('ws:local-relay', 'error', error);
		});
		
		// Connection to local graphql endpoint is "closed"
		localGraphqlApi.on('close', () => {
			log.debug('ws:local-relay', 'close');
		});

		// Connection to local graphql endpoint is "open"
		localGraphqlApi.on('open', () => {
			log.debug('ws:local-relay', 'open');

			// Authenticate with ourselves
			localGraphqlApi.send(JSON.stringify({
				type: 'connection_init',
				payload: {
					'x-api-key': apiKey
				}
            }));
		});

		// Relay message back to mothership
		localGraphqlApi.on('message', (data) => {
			try {
				relay.send(data);
			} catch (error) {
				// Relay socket is closed, close internal one
				if (error.message.includes('WebSocket is not open')) {
					localGraphqlApi.close();
				}
			}
		});

		// Sub to /servers on mothership
		mothershipServersEndpoint = subscribeToServers(apiKey)
	});

	// Relay is closed
	relay.on('close', async function (this: WebSocketWithHeartBeat, code, _message) {
		try {
			log.debug('Connection closed with code %s.', code);

			if (this.pingTimeout) {
				clearTimeout(this.pingTimeout);
			}

			// Close connection to local graphql endpoint
			localGraphqlApi?.close();

			// Clear all listeners before running this again
			relay?.removeAllListeners();

			// Stop subscriptions with mothership
			mothershipServersEndpoint?.unsubscribe();

			// Http 4XX error
			if (code >= 4400 && code <= 4499) {
				// Unauthorized - No API key?
				if (code === 4401) {
					log.debug('Invalid API key, waiting for new key...');
					return;
				}
			}

			// We likely closed this
			// This is usually because the API key is updated
			if (code === 4200) {
				// Reconnect
				connectToMothership(wsServer);
				return;
			}
			
			// Wait a few seconds
			await sleep(backoff(retryAttempt, ONE_MINUTE, 5));

			// Reconnect
			await connectToMothership(wsServer, retryAttempt + 1);
		} catch (error) {
			log.error('close error', error);
		}
	});

	relay.on('error', (error: NodeJS.ErrnoException) => {
		// The relay is down
		if (error.message.includes('502')) {
			return;
		}

		// Connection refused, aka couldn't connect
		// This is usually because the address is wrong or offline
		if (error.code === 'ECONNREFUSED') {
			// @ts-expect-error
			log.debug(`Couldn't connect to ${error.address}:${error.port}`);
			return;
		}

		log.error('socket error', error);
	});

	relay.on('ping', heartbeat);

	const sendMessage = (client, message, timeout = 1000) => {
		try {
			if (client.readyState === 0) {
				setTimeout(() => {
					sendMessage(client, message, timeout);
					log.debug('Message sent to mothership.', message)
				}, timeout);
				return;
			}

			client.send(message);
		} catch (error) {
			log.error('Failed replying to mothership.', error);
		};
	};

	relay.on('message', async (data: string) => {
		try {
			sendMessage(localGraphqlApi, data);
		} catch (error) {
			// Something weird happened while processing the message
			// This is likely a malformed message
			log.error(error);
		}
	});
};

/**
 * Disconnect from mothership.
 */
export const disconnectFromMothership = async () => {
	if (relay && relay.readyState !== CLOSED_READY_STATE) {
		log.debug('Disconnecting from the proxy server.');
		try {
			// 4200 === ok
			relay.close(4200);
		} catch {}
	}
};