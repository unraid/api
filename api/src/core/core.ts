/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { logger, nchanLogger } from '@app/core/log';
import { subscribeToNchanEndpoint } from '@app/core/utils';
import { config } from '@app/core/config';
import * as watchers from '@app/core/watchers';

/**
 * Decorated loading logger.
 * @param namespace
 */
const loadingLogger = (namespace: string): void => {
	logger.debug('Loading %s', namespace);
};

/**
 * Start all watchers.
 */
const loadWatchers = async (): Promise<void> => {
	if (config.safeMode) {
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
	watchers: loadWatchers,
};

/**
 * Main load function
 *
 * @name core.load
 */
const load = async (): Promise<void> => {
	await loadWatchers();
};

export const core = {
	loaders,
	load,
	loadNchan,
};
