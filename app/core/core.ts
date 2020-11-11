/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { StoppableServer } from 'stoppable';
import path from 'path';
import glob from 'glob';
import exitHook from 'async-exit-hook';
import camelCase from 'camelcase';
import globby from 'globby';
import pWaitFor from 'p-wait-for';
import getServerAddress from 'get-server-address';
import pIteration from 'p-iteration';
import clearModule from 'clear-module';
import { log } from './log';
import { paths } from './paths';
import { subscribeToNchanEndpoint, isNchanUp } from './utils';
import { config } from './config';
import { pluginManager } from './plugin-manager';
import * as watchers from './watchers';

// Has server been started
let serverUp = false;
// Have plugins loaded at least once
let pluginsLoaded = false;

// Magic values
const ONE_SECOND = 1000;
const TEN_SECONDS = 10 * ONE_SECOND;

/**
 * Decorated loading logger.
 * @param namespace
 * @param all
 * @param filePath
 */
const loadingLogger = (namespace: string, all: boolean, filePath: string): void => {
	log.debug('Loading @unraid/core:%s%s from %s', namespace, all ? ':*' : '', filePath);
};

/**
 * Register core path.
 */
const loadCorePath = async(): Promise<void> => {
	const filePath = __dirname;

	// Don't override already set path
	if (!paths.has('core')) {
		paths.set('core', filePath);
	}

	loadingLogger('paths:core', false, paths.get('core')!);
};

/**
 * Register state paths.
 */
const loadStatePaths = async(): Promise<void> => {
	const statesCwd = paths.get('states')!;
	const cwd = path.join(__dirname, 'states');

	loadingLogger('paths:state', true, cwd);

	const states = glob.sync('*.js', { cwd }).map(state => state.replace('.js', ''));
	states.forEach(state => {
		const name = `state:${camelCase(state, { pascalCase: true })}`;
		const filePath = `${path.join(statesCwd, state)}.ini`;

		// Don't override already set paths
		// @ts-ignore
		if (!paths.has(name)) {
			// ['state:Users', '/usr/local/emhttp/state/users.ini']
			// @ts-ignore
			paths.set(name, filePath);
		}
	});
};

/**
 * Register all plugins with PluginManager.
 */
const loadPlugins = async(): Promise<void> => {
	const pluginsCwd = paths.get('plugins');

	if (config.get('safe-mode') || !pluginsCwd) {
		log.debug('Skipping loading plugins');
		return;
	}

	const packages = globby
		.sync(['**/package.json', '!**/node_modules/**'], { cwd: pluginsCwd })
		// Remove all files
		.filter(packageName => packageName.includes('/'));
	const plugins = packages.map(plugin => plugin.replace('/package.json', ''));

	loadingLogger('plugins', false, pluginsCwd);

	// Reset caches so plugins can load from fresh state
	if (pluginsLoaded) {
		// Reset plugin manager
		pluginManager.reset();

		// Reset require cache
		// Without this plugin files wouldn't update until the server restarts
		await pIteration.forEach(plugins, async pluginName => {
			const cwd = path.join(pluginsCwd, pluginName);
			const pluginFiles = globby.sync(['**/*', '!**/node_modules/**'], { cwd });
			await pIteration.forEach(pluginFiles, pluginFile => {
				const filePath = path.join(pluginsCwd, pluginFile);
				log.debug('Clearing plugin file from require cache %s', filePath);
				clearModule(filePath);
			});
		});
	} else {
		// Update flag
		pluginsLoaded = true;
	}

	// Initialize all plugins with plugin manager
	await pIteration.forEach(plugins, async pluginName => pluginManager.init(pluginName));
};

/**
 * Start all watchers.
 */
const loadWatchers = async(): Promise<void> => {
	if (config.get('safe-mode')) {
		log.debug('Skipping loading watchers');
		return;
	}

	const watchersCwd = path.join(__dirname, 'watchers');
	loadingLogger('watchers', true, watchersCwd);

	// Start each watcher
	Object.values(watchers).forEach(watcher => {
		watcher().start();
	});
};

/**
 * Add api keys for users, etc.
 *
 * @name core.loadApiKeys
 * @async
 * @private
 */
const loadApiKeys = async(): Promise<void> => {
	// @todo: We should keep apikeys saved somewhere
	// if (!apiManager.getKey('user:root')) {
	// 	const filePath = paths.get('dynamix-config')!;
	// 	const config = loadState<DynamixConfig>(filePath);
	// 	const key = config?.remote?.apikey;

	// 	if (key) {
	// 		apiManager.add('my_servers', {
	// 			key,
	// 			userId: '0'
	// 		});
	// 	}
	// }
};

/**
 * Connect to nchan endpoints.
 *
 * @param endpoints
 */
const connectToNchanEndpoints = async(endpoints: string[]): Promise<void> => {
	log.debug('Connected to nchan, setting-up endpoints.');
	const connections = endpoints.map(async endpoint => subscribeToNchanEndpoint(endpoint));
	await Promise.all(connections);
};

/**
 * Start nchan subscriptions
 *
 * @name core.loadNchan
 * @async
 * @private
 */
const loadNchan = async(): Promise<void> => {
	const endpoints = ['devs', 'disks', 'sec', 'sec_nfs', 'shares', 'users', 'var'];

	log.debug('Trying to connect to nchan');

	// Wait for nchan to be up.
	await pWaitFor(isNchanUp, {
		timeout: TEN_SECONDS,
		interval: ONE_SECOND
	})
		// Once connected open a connection to each known endpoint
		.then(async() => connectToNchanEndpoints(endpoints))
		.catch(error => {
			// Nchan is likely unreachable
			if (error.message.includes('Promise timed out')) {
				log.error('Nchan timed out while trying to establish a connection.');
				return;
			}

			// Some other error occured
			throw error;
		});
};

/**
 * Core loaders.
 */
const loaders = {
	corePath: loadCorePath,
	statePaths: loadStatePaths,
	plugins: loadPlugins,
	watchers: loadWatchers
};

/**
 * Main load function
 *
 * @name core.load
 */
const load = async(): Promise<void> => {
	log.debug('Starting @unraid/core');
	await loadCorePath();
	await loadStatePaths();
	await loadPlugins();
	await loadWatchers();
	await loadApiKeys();

	// Load nchan
	if (process.env.NCHAN !== 'disable') {
		await loadNchan();
	}

	log.debug('Started @unraid/core');
};

/**
 * A server instance.
 */
interface Server {
	server: StoppableServer;
	start: () => Promise<StoppableServer> | StoppableServer;
	stop: () => Promise<void> | void;
}

/**
 * Stop a server
 *
 * @param name The server instance name.
 * @param server The server instance.
 */
const stopServer = async(name: string, server: Server): Promise<void> => {
	if (!serverUp) {
		log.debug(`${name} is already shutting down.`);
	}

	// Ensure we go back to the start of the line
	// this causes the ^C the be overridden
	process.stdout.write('\r');
	log.info(`Stopping ${name}`);

	// Stop the server
	await server.stop();
};

/**
 * Start a server
 *
 * @param name The server instance name.
 * @param server The server instance.
 */
const startServer = async(name: string, server: Server): Promise<Server> => {
	// Log only if the server actually binds to the port
	server.server.on('listening', () => {
		log.info('Listening at %s.', getServerAddress(server.server));
	});

	// Start server
	await server.start();

	log.debug(`Started ${name}`);

	return server;
};

/**
 * Loads a server.
 *
 * @name core.loadServer
 * @param name The name of the server instance to load.
 */
export const loadServer = async(name: string, server: Server): Promise<void> => {
	// Set process title
	process.title = name;

	// Human readable name
	const serverName = `@unraid/${name}`;

	// Start the server.
	log.debug(`Starting ${serverName}`);
	await startServer(serverName, server);

	// Prevents SIGINT calling close multiple times
	serverUp = true;

	// On process exit
	exitHook(async() => {
		// Stop the server
		await stopServer(name, server);
	});
};

export const core = {
	loaders,
	load,
	loadServer
};
