/*!
 * Copyright 2019-2020 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import net from 'net';
import stoppable from 'stoppable';
import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import core from '@unraid/core';
import { DynamixConfig, Var } from '@unraid/core/dist/types';
import { createServer } from './patched-install-subscription-handlers';
import { graphql } from './graphql';

const { log, config, utils, paths, errors, states } = core;
const { getEndpoints, globalErrorHandler, exitApp, loadState, sleep } = utils;
const { varState } = states;
const { AppError } = errors;

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
const graphApp = createServer(graphql);
graphApp.applyMiddleware({app});

// List all endpoints at start of server
app.get('/', (_, res) => {
	return res.send(getEndpoints(app));
});

// Handle errors by logging them and returning a 500.
// eslint-disable-next-line no-unused-vars
app.use((error, _, res, __) => {
	core.log.error(error);
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

// Add graphql subscription handlers
graphApp.installSubscriptionHandlers(wsServer);

/**
 * Connect to unraid's proxy server
 */
const connectToMothership = async () => {
	const filePath = paths.get('dynamix-config')!;
	const { remote } = loadState<DynamixConfig>(filePath);

	const apiKey = remote.apiKey || '';
	const keyFile = fs.readFileSync(varState.data?.regFile, 'utf-8');
	const serverName = `${varState.data?.name}`;
	const lanIp = `${varState.data?.name}`;
	const machineId = `${await utils.getMachineId()}`;

	// Connect to mothership
	const mothership = new WebSocket('wss://proxy.unraid.net', ['graphql-ws'], {
		headers: {
			'x-api-key': apiKey,
			'x-flash-guid': varState.data?.flashGuid,
			'x-key-file': keyFile,
			'x-server-name': serverName,
			'x-lan-ip': lanIp,
			'x-machine-id': machineId
		}
	});

	mothership.on('open', () => {
		// Connect mothership to the internal ws server
		wsServer.emit('connection', mothership);
	});
	mothership.on('error', console.error);
	mothership.on('close', () => { console.info('closed'); });
};

// Return an object with a server and start/stop async methods.
export const server = {
	server: stoppableServer,
	async start() {
		const retryConnection = async error => {
			log.debug(error);
			await sleep(5);
			await connectToMothership().catch(retryConnection);
		};

		// Start mothership connection
		connectToMothership().catch(retryConnection);

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