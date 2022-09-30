/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { logger } from '@app/core/log';
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
};
