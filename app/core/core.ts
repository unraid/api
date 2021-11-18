/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import glob from 'glob';
import camelCase from 'camelcase';
import globby from 'globby';
import pIteration from 'p-iteration';
import clearModule from 'clear-module';
import { log } from './log';
import { paths } from './paths';
import { subscribeToNchanEndpoint } from './utils';
import { config } from './config';
import { pluginManager } from './plugin-manager';
import * as watchers from './watchers';
import { nchanLog } from '.';

// Have plugins loaded at least once
let pluginsLoaded = false;

/**
 * Decorated loading logger.
 * @param namespace
 * @param all
 * @param filePath
 */
const loadingLogger = (namespace: string): void => {
	log.debug('Loading %s', namespace);
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
		log.debug('No plugins have been loaded as you\'re in SAFE MODE');
		return;
	}

	// Bail if there isn't a plugins directory
	if (!paths.get('plugins')) {
		log.debug('No plugins have been loaded as there was no plugins directory found.');
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
const loadWatchers = async (): Promise<void> => {
	if (config.get('safe-mode')) {
		log.debug('Skipping loading watchers');
		return;
	}

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
	nchanLog.debug('Connected, setting-up endpoints.');
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

	log.debug('Trying to connect to nchan');

	// Connect to each known endpoint
	await connectToNchanEndpoints(endpoints);
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

export const core = {
	loaders,
	load,
	loadNchan
};
