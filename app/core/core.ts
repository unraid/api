/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import glob from 'glob';
import exitHook from 'async-exit-hook';
import camelCase from 'camelcase';
import globby from 'globby';
import pWaitFor from 'p-wait-for';
import getServerAddress from 'get-server-address';
import pIteration from 'p-iteration';
import clearModule from 'clear-module';
import { log, coreLogger } from './log';
import { paths } from './paths';
import { subscribeToNchanEndpoint, isNchanUp } from './utils';
import { config } from './config';
import { pluginManager } from './plugin-manager';
import * as watchers from './watchers';
import { server as Server } from '../server';

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
const loadingLogger = (namespace: string): void => {
	coreLogger.debug('Loading %s', namespace);
};

/**
 * Register state paths.
 */
const loadStatePaths = async (): Promise<void> => {
	const statesCwd = paths.get('states')!;
	const cwd = path.join(__dirname, 'states');

	loadingLogger('state paths');

	const states = glob.sync('*.js', { cwd }).map(state => state.replace('.js', ''));
	states.forEach(state => {
		const name = `state:${camelCase(state, { pascalCase: true })}`;
		const filePath = `${path.join(statesCwd, state)}.ini`;

		// Don't override already set paths
		// @ts-expect-error
		if (!paths.has(name)) {
			// ['state:Users', '/usr/local/emhttp/state/users.ini']
			// @ts-expect-error
			paths.set(name, filePath);
		}
	});
};

/**
 * Register all plugins with PluginManager.
 */
const loadPlugins = async (): Promise<void> => {
	// Bail in safe mode
	if (config.get('safe-mode')) {
		coreLogger.debug('No plugins have been loaded as you\'re in SAFE MODE');
		return;
	}

	// Bail if there isn't a plugins directory
	if (!paths.get('plugins')) {
		coreLogger.debug('No plugins have been loaded as there was no plugins directory found.');
		return;
	}

	const pluginsCwd = paths.get('plugins')!;
	const packages = globby
		.sync(['**/package.json', '!**/node_modules/**'], { cwd: pluginsCwd })
		// Remove all files
		.filter(packageName => packageName.includes('/'));
	const plugins = packages.map(plugin => plugin.replace('/package.json', ''));

	loadingLogger('plugins');

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
				coreLogger.debug('Clearing plugin file from require cache %s', filePath);
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
const loadWatchers = async (): Promise<void> => {
	if (config.get('safe-mode')) {
		coreLogger.debug('Skipping loading watchers');
		return;
	}

	const watchersCwd = path.join(__dirname, 'watchers');
	loadingLogger('watchers');

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
const loadApiKeys = async (): Promise<void> => {
	// @TODO: For each key in a json file load them
};

/**
 * Connect to nchan endpoints.
 *
 * @param endpoints
 */
const connectToNchanEndpoints = async (endpoints: string[]): Promise<void> => {
	coreLogger.debug('Connected to nchan, setting-up endpoints.');
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
const loadNchan = async (): Promise<void> => {
	const endpoints = ['devs', 'disks', 'sec', 'sec_nfs', 'shares', 'users', 'var'];

	coreLogger.debug('Trying to connect to nchan');

	// Wait for nchan to be up.
	await pWaitFor(isNchanUp, {
		timeout: TEN_SECONDS,
		interval: ONE_SECOND
	})
		// Once connected open a connection to each known endpoint
		.then(async () => connectToNchanEndpoints(endpoints))
		.catch(error => {
			// Nchan is likely unreachable
			if (error.message.includes('Promise timed out')) {
				coreLogger.error('Nchan timed out while trying to establish a connection.');
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
	statePaths: loadStatePaths,
	plugins: loadPlugins,
	watchers: loadWatchers
};

/**
 * Main load function
 *
 * @name core.load
 */
const load = async (): Promise<void> => {
	await loadStatePaths();
	await loadPlugins();
	await loadWatchers();
	await loadApiKeys();
};

/**
 * Loads a server.
 *
 * @name core.loadServer
 * @param name The name of the server instance to load.
 */
export const loadServer = async (name: string, server: typeof Server): Promise<void> => {
	// Start the server.
	coreLogger.debug('Starting server');

	// Log only if the server actually binds to the port
	server.server.on('listening', () => {
		coreLogger.info('Listening at %s.', getServerAddress(server.server));
	});

	// Start server
	await server.start().catch(error => {
		log.error(error);
	});

	// On process exit
	exitHook(async () => {
		// Only do this when there's a TTY present
		if (process.stdout.isTTY) {
			// Ensure we go back to the start of the line
			// this causes the ^C the be overridden on a CTRL+C
			process.stdout.write('\r');
		}

		coreLogger.debug('Stopping server');

		// Stop the server
		server.stop();
	});
};

export const core = {
	loaders,
	load,
	loadServer,
	loadNchan
};
