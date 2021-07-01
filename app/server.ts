/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import net from 'net';
import path from 'path';
import execa from 'execa';
import cors from 'cors';
import stoppable from 'stoppable';
import chokidar from 'chokidar';
import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import { pki } from 'node-forge';
import { ApolloServer } from 'apollo-server-express';
import { log, config, paths, pubsub, coreLogger } from './core';
import { getEndpoints, globalErrorHandler, exitApp, cleanStdout, sleep, loadState } from './core/utils';
import { graphql } from './graphql';
import packageJson from '../package.json';
import display from './graphql/resolvers/query/display';
import { networkState, varState } from './core/states';

const configFilePath = path.join(paths.get('dynamix-base')!, 'case-model.cfg');
const customImageFilePath = path.join(paths.get('dynamix-base')!, 'case-model.png');

const updatePubsub = async () => {
	await pubsub.publish('display', {
		display: await display()
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
const port = process.env.PORT ?? String(config.get('port'));

const attemptJSONParse = (text: string, fallback: any = undefined) => {
	try {
		return JSON.parse(text);
	} catch {
		return fallback;
	}
};

const attemptReadFileSync = (path: string, fallback: any = undefined) => {
	try {
		return fs.readFileSync(path, 'utf-8');
	} catch {
		return fallback;
	}
};

// Cors options
const invalidOrigin = 'The CORS policy for this site does not allow access from the specified Origin.';

// Get extra origins from the user
const extraOriginPath = paths.get('extra-origins');

// Get cert + cert info
const certPem = attemptReadFileSync(paths.get('ssl-certificate')!);
const hash = certPem ? pki.certificateFromPem(certPem)?.subject?.attributes?.[0]?.value as string : undefined;

// To add extra origins create a file at the "extra-origins" path
const extraOrigins = extraOriginPath ? attemptJSONParse(attemptReadFileSync(extraOriginPath, ''), []) : [];

// Get myservers config
const configPath = paths.get('myservers-config')!;
const myServersConfig = loadState<{ remote: { wanport: string; wanaccess: string } }>(configPath);

// We use a "Set" + "array spread" to deduplicate the strings
const getAllowedOrigins = (): string[] => {
	// Get local ip from first ethernet adapter in the "network" state
	const localIp = networkState.data[0].ipaddr[0] as string;

	// Get local tld (in lowercase)
	const localTld = varState.data.localTld.toLowerCase();

	// Get server's hostname (in lowercase)
	const serverName = varState.data.name.toLowerCase();

	// Get webui http port (default to 80)
	const webuiHTTPPort = (varState.data.port ?? 80) === 80 ? '' : varState.data.port;

	// Get webui https port (default to 443)
	const webuiHTTPSPort = (varState.data.portssl ?? 443) === 443 ? '' : varState.data.portssl;

	// Get wan https port
	const wanHTTPSPort = parseInt(myServersConfig?.remote?.wanport ?? '', 10) === 443 ? '' : myServersConfig?.remote?.wanport;

	// Check if wan access is enabled
	const wanAccessEnabled = myServersConfig?.remote?.wanaccess === 'yes';

	// Only append the port if it's not HTTP/80 or HTTPS/443
	return [...new Set([
		// IP
		`http://${localIp}${webuiHTTPPort ? `:${webuiHTTPPort}` : ''}`,
		`https://${localIp}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`,

		// Raw local TLD
		`http://${serverName}${webuiHTTPPort ? `:${webuiHTTPPort}` : ''}`,
		`https://${serverName}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`,

		// Local TLD
		`http://${serverName}.${localTld}${webuiHTTPPort ? `:${webuiHTTPPort}` : ''}`,
		`https://${serverName}.${localTld}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`,

		// Hash
		...(hash ? [`https://${hash}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`] : []),

		// Wan hash
		...(hash && wanAccessEnabled ? [`https://www.${hash}${wanHTTPSPort ? `:${wanHTTPSPort}` : ''}`] : []),

		// Notifier bridge
		'/var/run/unraid-notifications.sock',

		// Other endpoints should be added below
		...extraOrigins
	]).values()];
};

// Cors
app.use(cors({
	origin: function (origin, callback) {
		// Get currently allowed origins
		const allowedOrigins = getAllowedOrigins();
		log.debug(`Allowed origins: ${allowedOrigins.join(', ')}`);

		// Disallow requests with no origin
		// (like mobile apps, curl requests or viewing /graphql directly)
		if (!origin) {
			// If in debug mode allow this
			if (config.get('debug')) {
				callback(null, true);
				return;
			}

			log.debug('No origin provided, denying CORS!');
			callback(new Error(invalidOrigin), false);
			return;
		}

		log.debug(`Checking "${origin.toLowerCase()}" for CORS access.`);

		// Only allow known origins
		if (!allowedOrigins.includes(origin.toLowerCase())) {
			callback(new Error(invalidOrigin), false);
			return;
		}

		callback(null, true);
	}
}));

// Add Unraid API version header
app.use(async (_req, res, next) => {
	// Only get the machine ID on first request
	// We do this to avoid using async in the main server function
	if (!app.get('x-unraid-api-version')) {
		app.set('x-unraid-api-version', packageJson.version);
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
// @ts-expect-error
const graphApp = new ApolloServer(graphql);
graphApp.applyMiddleware({ app });

// List all endpoints at start of server
app.get('/', (_, res) => {
	return res.send(getEndpoints(app));
});

// Handle errors by logging them and returning a 500.
app.use((error, _, res, __) => {
	// Don't log CORS errors
	if (!error.message.includes('CORS')) {
		log.error(error);
	}

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
		fs.chmodSync(port, 660);
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

export const server = {
	httpServer,
	server: stoppableServer,
	async start() {
		// Start http server
		return stoppableServer.listen(port);
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
			} catch { }
		}

		// Run callback
		if (callback) {
			callback();
			return;
		}

		// Gracefully exit
		exitApp();
	}
};
