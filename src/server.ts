/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import net from 'net';
import path from 'path';
import execa from 'execa';
import cors from 'cors';
import stoppable from 'stoppable';
import chokidar from 'chokidar';
import express, { Response } from 'express';
import http from 'http';
import WebSocket from 'ws';
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express';
import { logger, config, paths, pubsub } from '@app/core';
import { graphql } from '@app/graphql';
import { verifyTwoFactorToken } from '@app/common/two-factor';
import display from '@app/graphql/resolvers/query/display';
import { getEndpoints } from '@app/core/utils/misc/get-endpoints';
import { cleanStdout } from '@app/core/utils/misc/clean-stdout';
import { sleep } from '@app/core/utils/misc/sleep';
import { exitApp } from '@app/core/utils/misc/exit-app';
import { globalErrorHandler } from '@app/core/utils/misc/global-error-handler';
import { getAllowedOrigins } from '@app/common/allowed-origins';
import { version } from '@app/../package.json';

const configFilePath = path.join(paths['dynamix-base'], 'case-model.cfg');
const customImageFilePath = path.join(paths['dynamix-base'], 'case-model.png');

const updatePubsub = async () => {
	await pubsub.publish('display', {
		display: await display(),
	});
};

// Update pub/sub when config/image file is added/updated/removed
chokidar.watch(configFilePath).on('all', updatePubsub);
chokidar.watch(customImageFilePath).on('all', updatePubsub);

/**
 * The Graphql server.
 */
const app = express();

// Graphql port
const port = process.env.PORT ?? config.port;

// Cors error
const invalidOrigin = 'The CORS policy for this site does not allow access from the specified Origin.';

// Ensure json bodies can be parsed
app.use(express.json());

// Cors
app.use(cors({
	origin(origin, callback) {
		// Get currently allowed origins
		const allowedOrigins = getAllowedOrigins();
		logger.trace(`Allowed origins: ${allowedOrigins.join(', ')}`);

		// Disallow requests with no origin
		// (like mobile apps, curl requests or viewing /graphql directly)
		if (!origin) {
			// If in debug mode allow this
			if (config.debug) {
				logger.debug('Debug mode is enabled, bypassing CORS check.');
				callback(null, true);
				return;
			}

			logger.debug('No origin provided, denying CORS!');
			callback(new Error(invalidOrigin), false);
			return;
		}

		logger.trace(`📒 Checking "${origin.toLowerCase()}" for CORS access.`);

		// Only allow known origins
		if (!allowedOrigins.includes(origin.toLowerCase())) {
			callback(new Error(invalidOrigin), false);
			logger.error('❌ %s is not in the allowed origins list, denying CORS!', origin.toLowerCase());
			return;
		}

		logger.trace('✔️ Origin check passed, granting CORS!');
		callback(null, true);
	},
}));

// Add Unraid API version header
app.use(async (_req, res, next) => {
	// Only get the machine ID on first request
	// We do this to avoid using async in the main server function
	if (!app.get('x-unraid-api-version')) {
		app.set('x-unraid-api-version', version);
	}

	// Update header with unraid API version
	res.set('x-unraid-api-version', app.get('x-unraid-api-version'));

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
const graphApp = new ApolloServer(graphql as unknown as ApolloServerExpressConfig);
graphApp.applyMiddleware({ app });

// List all endpoints at start of server
app.get('/', (_, res) => res.send(getEndpoints(app)));

app.post('/verify', async (req, res) => {
	try {
		// Check two-factor token is valid
		verifyTwoFactorToken(req.body?.username, req.body?.token);

		// Success
		logger.debug('2FA token valid, allowing login.');

		// Allow the user to pass
		res.sendStatus(204);
		return;
	} catch (error: unknown) {
		logger.addContext('error', error);
		logger.error('Failed validating 2FA token.');
		logger.removeContext('error');

		// User failed verification
		res.status(401);
		res.send((error as Error).message);
	}
});

// Handle errors by logging them and returning a 500.
app.use((error: Error & { stackTrace?: string; status?: number }, _, res: Response, __) => {
	// Don't log CORS errors
	if (error.message.includes('CORS')) return;

	logger.error(error);

	if (error.stack) {
		error.stackTrace = error.stack;
	}

	res.status(error.status ?? 500).send(error);
});

const httpServer = http.createServer(app);
const stoppableServer = stoppable(httpServer);

// Port is a UNIX socket file
if (isNaN(parseInt(port, 10))) {
	stoppableServer.on('listening', () => {
		// Set permissions
		fs.chmodSync(port, 660);
	});

	stoppableServer.on('error', async (error: NodeJS.ErrnoException) => {
		if (error.code !== 'EADDRINUSE') {
			logger.error(error);
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
			path: port,
		}, () => {
			exitApp();
		}).on('error', (error: NodeJS.ErrnoException) => {
			// Port was set to a path that already exists and isn't a unix socket
			// Let's bail since we don't know if this was intentional
			if (error.code === 'ENOTSOCK') {
				logger.warn('%s is not a unix socket and already exists', port);
				exitApp();
			}

			if (error.code !== 'ECONNREFUSED') {
				logger.error(error);

				process.exitCode = 1;
			}

			// Not in use: delete it and re-listen
			fs.unlinkSync(port);

			setTimeout(() => {
				stoppableServer.listen(port);
			}, 1000);
		});
	});

	process.once('uncaughtException', (error: NodeJS.ErrnoException) => {
		// Skip EADDRINUSE as it's already handled above
		if (error.code !== 'EADDRINUSE') {
			globalErrorHandler(error);
		}
	});

	process.once('unhandledRejection', error => {
		if (error instanceof Error) {
			globalErrorHandler(error);
		}
	});
}

// Main ws server
const wsServer = new WebSocket.Server({ noServer: true });

// Add ws upgrade functionality back in.
stoppableServer.on('upgrade', (request, socket, head) => {
	wsServer.handleUpgrade(request, socket as net.Socket, head, ws => {
		wsServer.emit('connection', ws);
	});
});

// Add graphql subscription handlers
graphApp.installSubscriptionHandlers(wsServer);

export const server = {
	httpServer,
	server: stoppableServer,
	async start() {
		// Start http server
		return stoppableServer.listen(port);
	},
	stop(callback?: () => void) {
		// Stop http server from accepting new connections and close existing connections
		stoppableServer.stop(error => {
			if (error) {
				globalErrorHandler(error);
			}
		});

		// Stop ws server
		wsServer.close();

		// Unlink socket file
		if (isNaN(parseInt(port, 10))) {
			try {
				fs.unlinkSync(port);
			} catch { }
		}

		// Run callback
		if (callback) {
			callback();
			return;
		}

		// Gracefully exit
		exitApp();
	},
};
