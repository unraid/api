/*!
 * Copyright 2019-2020 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import net from 'net';
import stoppable from 'stoppable';
import express from 'express';
import http from 'http';
import { ApolloServer } from 'apollo-server-express';
import core from '@unraid/core';
import { graphql } from './graphql';

const { log, config, utils } = core;
const { getEndpoints, globalErrorHandler, exitApp } = utils;

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

// Add graphql subscription handlers
graphApp.installSubscriptionHandlers(stoppableServer);

// Return an object with a server and start/stop async methods.
export const server = {
	server: stoppableServer,
	async start() {
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
		// Stop the server from accepting new connections and close existing connections
		stoppableServer.stop(globalErrorHandler);

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