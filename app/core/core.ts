/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import glob from 'glob';
import camelCase from 'camelcase';
import { logger } from './log';
import { paths } from './paths';
import { subscribeToNchanEndpoint } from './utils';
import { config } from './config';
import * as watchers from './watchers';
import { nchanLogger } from '.';

/**
 * Decorated loading logger.
 * @param namespace
 */
const loadingLogger = (namespace: string): void => {
	logger.debug('Loading %s', namespace);
};

/**
 * Register state paths.
 */
const loadStatePaths = async (): Promise<void> => {
	const statesCwd = paths.states;
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
 * Start all watchers.
 */
const loadWatchers = async (): Promise<void> => {
	if (config.get('safe-mode')) {
		logger.debug('Skipping loading watchers');
		return;
	}

	loadingLogger('watchers');

	// Start each watcher
	Object.entries(watchers).forEach(([name, watcher]) => {
		logger.debug('Loading %s watcher', name);
		watcher().start();
	});
};

/**
 * Connect to nchan endpoints.
 *
 * @param endpoints
 */
const connectToNchanEndpoints = async (endpoints: string[]): Promise<void> => {
	nchanLogger.debug('Connected, setting-up endpoints.');
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

	logger.debug('Trying to connect to nchan');

	// Connect to each known endpoint
	await connectToNchanEndpoints(endpoints);
};

/**
 * Core loaders.
 */
const loaders = {
	statePaths: loadStatePaths,
	watchers: loadWatchers
};

/**
 * Main load function
 *
 * @name core.load
 */
const load = async (): Promise<void> => {
	await loadStatePaths();
	await loadWatchers();
};

export const core = {
	loaders,
	load,
	loadNchan
};
