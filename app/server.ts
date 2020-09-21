/*!
 * Copyright 2019-2020 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import net from 'net';
import stoppable from 'stoppable';
import chokidar from 'chokidar';
import express from 'express';
import http from 'http';
import waitFor from 'p-wait-for';
import dotProp from 'dot-prop';
import WebSocket from 'ws';
import { ApolloServer } from 'apollo-server-express';
import { log, config, utils, paths } from '@unraid/core';
import { graphql } from './graphql';
import { connectToMothership } from './mothership';

const { getEndpoints, globalErrorHandler, exitApp, loadState } = utils;

/**
 * One second in milliseconds.
 */
const ONE_SECOND = 1000;

/**
 * The Graphql server.
 */
const app = express();
const port = String(config.get('graphql-api-port'));

app.use(async (_req, res, next) => {
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
// @ts-expect-error
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

export const server = {
	server: stoppableServer,
	async start() {
		const filePath = paths.get('dynamix-config')!;
		const watcher = chokidar.watch(filePath);
		const getApiKey = () => {
			const key = dotProp.get(loadState(filePath), 'remote.apikey');
			return (key === undefined || String(key).trim() === '') ? undefined : key;
		};
		const reconnect = async () => {
			log.debug('my_servers API key was updated, restarting proxy connection.');
			process.nextTick(() => {
				if (getApiKey() !== undefined) {
					connectToMothership(wsServer);
				}
			});
		};

		let timeout: NodeJS.Timeout;
		// If we detect an event wait 0.5s before doing anything
		const startWatcher = () => {
			watcher.on('all', () => {
				clearTimeout(timeout);
				timeout = setTimeout(reconnect, 500);
			});
		};

		// Once we have a valid key connect to the proxy server
		waitFor(() => getApiKey() !== undefined, {
			// Check every 1 second
			interval: ONE_SECOND
		}).then(async () => {
			log.debug('Found my_servers apiKey, starting proxy connection.');
			await connectToMothership(wsServer);
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