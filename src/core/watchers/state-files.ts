/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import chokidar from 'chokidar';
import prettyMilliseconds from 'pretty-ms';
import { paths } from '../paths';
import { logger } from '../log';
import { devicesState, networkState, nfsSecState, sharesState, slotsState, smbSecState, usersState, varState, ArrayState, State } from '../states';

const stateMapping = {
	'devs.ini': devicesState,
	'network.ini': networkState,
	'sec_nfs.ini': nfsSecState,
	'shares.ini': sharesState,
	'disks.ini': slotsState,
	'sec.ini': smbSecState,
	'users.ini': usersState,
	'var.ini': varState
};

const getState = (fullPath: string) => {
	const fileName = fullPath.split('/').pop()!;
	return Object.keys(stateMapping).includes(fileName) ? stateMapping[fileName] : undefined;
};

export const states = () => {
	const STATES_RELOAD_TIME_MS = 5000; // 5s
	const statesCwd = paths.states;
	const watchers: chokidar.FSWatcher[] = [];
	let timeout: NodeJS.Timeout;

	const reloadState = (state: ArrayState | State) => () => {
		logger.debug('Reloading state as it\'s been %s since last event.', prettyMilliseconds(STATES_RELOAD_TIME_MS));

		// Reload state
		try {
			state.reset();
		} catch (error: unknown) {
			logger.error('failed resetting state', error);
		}
	};

	return {
		start() {
			// Only run if NCHAN is disabled
			if (process.env.NCHAN !== 'disable') {
				return;
			}

			// Update states when state files change
			const watcher = chokidar.watch(statesCwd, {
				persistent: true,
				ignoreInitial: true,
				ignored: (path: string) => ['node_modules'].some(s => path.includes(s))
			});

			logger.debug('Loading watchers for %s', statesCwd);

			// State file has updated, updating state object
			watcher.on('all', (event, fullPath) => {
				// Reset timeout
				clearTimeout(timeout);

				// Ensure we only handle known files
				const state = getState(fullPath);
				if (!state) {
					return;
				}

				// Update timeout
				timeout = setTimeout(reloadState(state), STATES_RELOAD_TIME_MS);
				logger.debug('States directory %s has emitted %s event.', fullPath, event);
			});

			// Save ref for cleanup
			watchers.push(watcher);
		},
		stop() {
			watchers.forEach(async watcher => watcher.close());
		}
	};
};
