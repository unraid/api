/*!
 * Copyright 2019-2020 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import net from 'net';
import request from 'request';
import stoppable from 'stoppable';
import chokidar from 'chokidar';
import express from 'express';
import http from 'http';
import waitFor from 'p-wait-for';
import dotProp from 'dot-prop';
import WebSocket from 'ws';
import { ApolloServer } from 'apollo-server-express';
import { log, config, utils, paths, states } from '@unraid/core';
import { DynamixConfig } from '@unraid/core/dist/lib/types';
import { graphql } from './graphql';
import { userCache, CachedUser } from './cache';

const { getEndpoints, globalErrorHandler, exitApp, loadState } = utils;
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
 * Ten minutes in milliseconds.
 */
const TEN_MINUTES = 10 * ONE_MINUTE;

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

/**
 * The Graphql server.
 */
const app = express();
const port = String(config.get('graphql-api-port'));

app.use(async (req, res, next) => {
	// Only get the machine ID on first request
	// We do this to avoid using async in the main server function
	if (!app.get('x-machine-id')) {
		// eslint-disable-next-line require-atomic-updates
		app.set('x-machine-id', await utils.getMachineId());
	}

	// Update header with machine ID
	res.set('x-machine-id', app.get('x-machine-id'));

	next();
});

// Mount graph endpoint
const graphApp = new ApolloServer(graphql);
graphApp.applyMiddleware({app});

// List all endpoints at start of server
app.get('/', (_, res) => {
	return res.send(getEndpoints(app));
});

// Handle errors by logging them and returning a 500.
// eslint-disable-next-line no-unused-vars
app.use((error, _, res, __) => {
	log.error(error);
	if (error.stack) {
		error.stackTrace = error.stack;
	}

	res.status(error.status || 500).send(error);
});

const httpServer = http.createServer(app);
const stoppableServer = stoppable(httpServer);

const handleError = error => {
	if (error.code !== 'EADDRINUSE') {
		throw error;
	}

	if (!isNaN(parseInt(port, 10))) {
		throw error;
	}

	stoppableServer.close();

	net.connect({
		path: port
	}, () => {
		// Really in use: re-throw
		throw error;
	}).on('error', (error: NodeJS.ErrnoException) => {
		if (error.code !== 'ECONNREFUSED') {
			log.error(error);

			process.exitCode = 1;
		}

		// Not in use: delete it and re-listen
		fs.unlinkSync(port);

		setTimeout(() => {
			stoppableServer.listen(port);
		}, 1000);
	});
};

// Port is a UNIX socket file
if (isNaN(parseInt(port, 10))) {
	stoppableServer.on('listening', () => {
		// In production this will let pm2 know we're ready
		if (process.send) {
			process.send('ready');
		}

		// Set permissions
		return fs.chmodSync(port, 660);
	});

	stoppableServer.on('error', handleError);

	process.on('uncaughtException', (error: NodeJS.ErrnoException) => {
		// Skip EADDRINUSE as it's already handled above
		if (error.code !== 'EADDRINUSE') {
			globalErrorHandler(error);
		}
	});

	process.on('unhandledRejection', error => {
		if (error instanceof Error) {
			globalErrorHandler(error);
		}
	});
}

// Main ws server
const wsServer = new WebSocket.Server({ noServer: true });

// Add ws upgrade functionality back in.
stoppableServer.on('upgrade', (request, socket, head) => {
	wsServer.handleUpgrade(request, socket, head, ws => {
		wsServer.emit('connection', ws);
	});
});

// Add graphql subscription handlers
graphApp.installSubscriptionHandlers(wsServer);

let mothership;

/**
 * Connect to unraid's proxy server
 */
const connectToMothership = async (currentRetryAttempt: number = 0) => {
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
			await connectToMothership(retryAttempt + 1);
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

	interface Message {
		type: 'query' | 'mutation' | 'start' | 'stop' | 'proxy-data';
		payload: {
			operationName: any;
			variables: {};
			query: string;
			data: any;
		}
	};

	mothership.on('message', async (data: string) => {
		try {
			const message: Message = JSON.parse(data);

			// Proxy this to the http endpoint
			if (message.type === 'query' || message.type === 'mutation') {
				log.debug(`Got a ${message.type} request from mothership, forwarding to socket.`);
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
						log.debug('Replying to mothership with payload', payload);
						mothership.send(JSON.stringify({
							type: 'data',
							payload
						}));
					} catch (error) {
						log.error(error);
						mothership.close();
					}
				});
			}

			const isUserObject = (data): data is CachedUser => {
				const keys = Object.keys(data);
				return keys.includes('profile') && keys.includes('servers') && keys.length === 2;
			};

			if (message.type === 'proxy-data') {
				const { data } = message.payload;

				// Cache the response
				if (isUserObject(data)) {
					userCache.set('mine', data);
					return;
				}
				
			}
		} catch (error) {
			// Something weird happened while processing the message
			// This is likely a malformed message
			log.error(error);
		}
	});
};

const disconnectFromMothership = async () => {
	if (mothership) {
		log.debug('Disconnecting from the proxy server.');
		try {
			mothership.close();
			mothership = undefined;
		} catch {}
	}
};

export const server = {
	server: stoppableServer,
	async start() {
		const filePath = paths.get('dynamix-config')!;
		const watcher = chokidar.watch(filePath);
		const getApiKey = () => dotProp.get(loadState(filePath), 'remote.apikey');
		const startWatcher = () => {
			watcher.on('raw', async () => {
				const key = getApiKey();

				// Try and stop the last connection if it's still open
				await disconnectFromMothership();
	
				log.debug('my_servers API key was updated, restarting proxy connection.');
				process.nextTick(() => {
					if (key !== undefined) {
						connectToMothership();
					}
				});
			});
		};

		// Once we have a valid key connect to the proxy server
		waitFor(() => getApiKey() !== undefined, {
			// Check every 1 second
			interval: ONE_SECOND
		}).then(async () => {
			log.debug('Found my_servers apiKey, starting proxy connection.');
			await connectToMothership();
			startWatcher();
		});

		// Start http server
		return stoppableServer.listen(port, () => {
			// Downgrade process user to owner of this file
			return fs.stat(__filename, (error, stats) => {
				if (error) {
					throw error;
				}

				return process.setuid(stats.uid);
			});
		});
	},
	stop() {
		// Stop http server from accepting new connections and close existing connections
		stoppableServer.stop(globalErrorHandler);

		// Stop ws server
		wsServer.close();

		const name = process.title;
		const serverName = `@unraid/${name}`;

		// Unlink socket file
		if (isNaN(parseInt(port, 10))) {
			fs.unlinkSync(port);
		}

		log.info(`Successfully stopped ${serverName}`);

		// Gracefully exit
		exitApp();
	}
};