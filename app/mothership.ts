import fs from 'fs';
import request from 'request';
import WebSocket from 'ws';
import { log, utils, paths, states } from '@unraid/core';
import { DynamixConfig } from '@unraid/core/dist/lib/types';
import { userCache, CachedServer } from './cache';

const { loadState } = utils;
const { varState } = states;

/**
 * One second in milliseconds.
 */
const ONE_SECOND = 1000;
/**
 * One minute in milliseconds.
*/
const ONE_MINUTE = 60 * ONE_SECOND;

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

let mothership;

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
}

type MessageType = 'query' | 'mutation' | 'start' | 'stop' | 'proxy-data';
interface Message {
	type: MessageType;
	payload: {
		operationName: any;
		variables: {};
		query: string;
		data: any;
		topic?: string;
	}
};

type Server = CachedServer;
type Servers = Server[];
interface ProxyMessage extends Omit<Message, 'payload'> {
	type: MessageType
	payload: {
		topic: 'servers';
		data: Servers;
	}
};

const isProxyMessage = (message: any): message is ProxyMessage => {
	const keys = Object.keys(message.payload ?? {});
	return message.payload && message.type === 'proxy-data' && keys.length === 2 && keys.includes('topic') && keys.includes('data');
};

const isServersPayload = (payload: any): payload is Servers => payload.topic === 'servers';

const forwardMessageToLocalSocket = (message: Message, apiKey: string) => {
	log.debug(`Got a "${message.type}" request from mothership, forwarding to socket.`);
	request.post('http://unix:/var/run/graphql-api.sock:/graphql', {
		body: JSON.stringify({
			operationName: null,
			variables: {},
			query: message.payload.query
		}),
		headers: {
			Accept: '*/*',
			'Content-Type': 'application/json',
			'x-api-key': apiKey
		}
	}, (error, response) => {
		if (error) {
			log.error(error);
			return;
		}

		try {
			const data = JSON.parse(response.body).data;
			const payload = { data };
			log.debug('Replying to mothership with payload %o', payload);
			mothership.send(JSON.stringify({
				type: 'data',
				payload
			}));
		} catch (error) {
			log.error(error);
			mothership.close();
		}
	});
};

/**
 * Connect to unraid's proxy server
 */
export const connectToMothership = async (wsServer, currentRetryAttempt: number = 0) => {
	// Kill the last connection first
	await disconnectFromMothership();
	let retryAttempt = currentRetryAttempt;

	if (retryAttempt >= 1) {
		log.debug(`Reconnecting to mothership, attempt ${retryAttempt}.`);
	}
	
	const apiKey = loadState<DynamixConfig>(paths.get('dynamix-config')!).remote.apikey || '';
	const keyFile = varState.data?.regFile ? fs.readFileSync(varState.data?.regFile).toString('base64') : '';
	const serverName = `${varState.data?.name}`;
	const lanIp = states.networkState.data.find(network => network.ipaddr[0]).ipaddr[0] || '';
	const machineId = `${await utils.getMachineId()}`;

	// Connect to mothership
	// Keep reference outside this scope so we can disconnect later
	mothership = new WebSocket('wss://proxy.unraid.net', ['graphql-ws'], {
		headers: {
			'x-api-key': apiKey,
			'x-flash-guid': varState.data?.flashGuid ?? '',
			'x-key-file': keyFile ?? '',
			'x-server-name': serverName,
			'x-lan-ip': lanIp,
			'x-machine-id': machineId
		}
	});

	mothership.on('open', function() {
		log.debug('Connected to mothership.');

		// Reset retry attempts
		retryAttempt = 0;

		// Connect mothership to the internal ws server
		wsServer.emit('connection', mothership);

		// Start ping/pong
		// @ts-ignore
		heartbeat.bind(this);
	});
	mothership.on('close', async function (this: WebSocketWithHeartBeat) {
		if (this.pingTimeout) {
			clearTimeout(this.pingTimeout);
		}

		// Clear all listeners before running this again
		mothership.removeAllListeners();

		// Reconnect
		setTimeout(async () => {
			await connectToMothership(wsServer, retryAttempt + 1);
		}, backoff(retryAttempt, ONE_MINUTE, 2));
	});

	mothership.on('error', error => {
		// Mothership is down
		if (error.message.includes('502')) {
			return;
		}

		log.error(error.message);
	});

	mothership.on('ping', heartbeat);

	mothership.on('message', async (stringifiedData: string) => {
		try {
			const message: Message = JSON.parse(stringifiedData);

			// Proxy this to the http endpoint
			if (message.type === 'query' || message.type === 'mutation') {
				forwardMessageToLocalSocket(message, apiKey);
				return;
			}

			log.debug(`Got a "${message.type}" request from mothership, handling internally.`);

			if (isProxyMessage(message)) {
				const payload = message.payload;

				if (isServersPayload(payload)) {
					const mine = userCache.get<CachedServer>('mine');
					userCache.set('mine', {
						...mine,
						servers: payload.data
					});
				}
			}
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
	if (mothership) {
		log.debug('Disconnecting from the proxy server.');
		try {
			mothership.close();
			mothership = undefined;
		} catch {}
	}
};