/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import net from 'net';
import path from 'path';
import execa from 'execa';
import stoppable from 'stoppable';
import chokidar from 'chokidar';
import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import { ApolloServer } from 'apollo-server-express';
import { log, config, utils, paths, pubsub, apiManager, coreLogger } from './core';
import { getEndpoints, globalErrorHandler, exitApp, cleanStdout, sleep } from './core/utils';
import { graphql } from './graphql';
import { mothership } from './mothership';
import display from './graphql/resolvers/query/display';

const configFilePath = path.join(paths.get('dynamix-base')!, 'case-model.cfg');
const customImageFilePath = path.join(paths.get('dynamix-base')!, 'case-model.png');

const updatePubsub = async () => {
	pubsub.publish('display', {
		display: await display()
	});
};

// Update pub/sub when config/image file is added/updated/removed
chokidar.watch(configFilePath).on('all', updatePubsub);
chokidar.watch(customImageFilePath).on('all', updatePubsub);

/**
 * One second in milliseconds.
 */
const ONE_SECOND = 1000;

/**
 * The Graphql server.
 */
const app = express();

const port = process.env.PORT ?? String(config.get('port'));

app.use(async (_req, res, next) => {
	// Only get the machine ID on first request
	// We do this to avoid using async in the main server function
	if (!app.get('x-machine-id')) {
		app.set('x-machine-id', await utils.getMachineId());
	}

	// Update header with machine ID
	res.set('x-machine-id', app.get('x-machine-id'));

	next();
});

// In all environments apart from production add the env to the headers
if (process.env.ENVIRONMENT !== 'production') {
	app.use(async (_req, res, next) => {
		// Only get the machine ID on first request
		// We do this to avoid using async in the main server function
		if (!app.get('x-environment')) {
			app.set('x-environment', process.env.ENVIRONMENT);
		}
	
		// Update header with current environment
		res.set('x-environment', app.get('x-environment'));
	
		next();
	});
}

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

// Port is a UNIX socket file
if (isNaN(parseInt(port, 10))) {
	stoppableServer.on('listening', () => {
		// Set permissions
		return fs.chmodSync(port, 660);
	});

	stoppableServer.on('error', async (error: NodeJS.ErrnoException) => {
		if (error.code !== 'EADDRINUSE') {
			coreLogger.error(error);
			throw error;
		}
	
		// Check if port is unix socket or numbered port
		// If it's a numbered port then throw
		if (!isNaN(parseInt(port, 10))) {
			throw error;
		}

		// Check if the process that made this file is still alive
		const pid = await execa.command(`lsof -t ${port}`)
            .then(output => {
				const pids = cleanStdout(output).split('\n');
				return pids[0];
			}).catch(() => undefined);

		// Try to kill it?
		if (pid) {
			await execa.command(`kill -9 ${pid}`);
			await sleep(2000);
		}

		// No pid found or we just killed the old process
		// Now let's retry

		// Stop the server
		stoppableServer.close();
	
		// Restart the server
		net.connect({
			path: port
		}, () => {
			exitApp();
		}).on('error', (error: NodeJS.ErrnoException) => {
			// Port was set to a path that already exists and isn't a unix socket
			// Let's bail since we don't know if this was intentional
			if (error.code === 'ENOTSOCK') {
				coreLogger.debug('%s is not a unix socket and already exists', port);
				exitApp();
			}

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
	});

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

const attachApiManagerToMothershipListeners = () => {
	// If key is in an invalid format disconnect
	apiManager.on('expire', async () => {
		await mothership.disconnect();
	});

	// If key looks valid try and connect with it
	apiManager.on('replace', async () => {
		await mothership.connect(wsServer);
	});
};

export const server = {
	httpServer,
	server: stoppableServer,
	async start() {
		// Start http server
		return stoppableServer.listen(port, () => {
			// Start listening to API key changes
			// When the key changes either disconnect or connect
			attachApiManagerToMothershipListeners();

			// Downgrade process user to owner of this file
			return fs.stat(__filename, (error, stats) => {
				if (error) {
					throw error;
				}

				return process.setuid(stats.uid);
			});
		});
	},
	stop(callback?: () => void) {
		// Stop http server from accepting new connections and close existing connections
		stoppableServer.stop(globalErrorHandler);

		// Stop ws server
		wsServer.close();

		// Unlink socket file
		if (isNaN(parseInt(port, 10))) {
			try {
				fs.unlinkSync(port);
			} catch {}
		}

		// Run callback
		if (callback) {
			return callback();
		}

		// Gracefully exit
		exitApp();
	}
};