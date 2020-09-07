import fs from 'fs';
import WebSocket from 'ws';
import { utils, paths, states, config } from '@unraid/core';
import { DynamixConfig } from '@unraid/core/dist/lib/types';

const log = console;

const { loadState } = utils;
const { varState } = states;

process.on('uncaughtException', console.log);
process.on('unhandledRejection', console.log);

const internalWsAddress = () => {
	const port = config.get('graphql-api-port');
	return isNaN(port as any)
		// Unix Socket
		? `ws+unix:${port}`
		// Numbered port
		: `ws://localhost:${port}`;
}

/**
 * One second in milliseconds.
 */
const ONE_SECOND = 1000;
/**
 * One minute in milliseconds.
*/
const ONE_MINUTE = 60 * ONE_SECOND;

/**
 * Relay ws link.
 */
const RELAY_WS_LINK = process.env.RELAY_WS_LINK ? process.env.RELAY_WS_LINK : 'wss://relay.unraid.net';

/**
 * Internal ws link.
 */
const INTERNAL_WS_LINK = process.env.INTERNAL_WS_LINK ? process.env.INTERNAL_WS_LINK : internalWsAddress();

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

	// Connect to mothership's relay endpoint
	// Keep reference outside this scope so we can disconnect later
	relay = new WebSocket(RELAY_WS_LINK, ['graphql-ws'], {
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
		log.debug(`Connected to mothership's relay.`);

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
	});

	// Relay is closed
	relay.on('close', async function (this: WebSocketWithHeartBeat, ...args) {
		try {
			log.debug('Connection closed.', ...args);

			if (this.pingTimeout) {
				clearTimeout(this.pingTimeout);
			}

			// Clear all listeners before running this again
			relay?.removeAllListeners();

			// Close connection to local graphql endpoint
			localGraphqlApi?.close();

			// Reconnect
			setTimeout(async () => {
				await connectToMothership(wsServer, retryAttempt + 1);
			}, backoff(retryAttempt, ONE_MINUTE, 5));
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
	if (relay && relay.readyState !== 0) {
		log.debug('Disconnecting from the proxy server.');
		try {
			relay.close();
		} catch {}
	}
};