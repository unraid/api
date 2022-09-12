/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import chokidar, { watch } from 'chokidar';
import { logger } from '@app/core/log';
import { existsSync } from 'fs';
import { loadState } from '@app/core/utils/misc/load-state';
import { getters, store } from '@app/store';
import { updateNginxState } from '@app/store/modules/nginx';
import { NginxIni } from '@app/core/states/nginx';

const watchStateFile = () => {
	// State file path
	const filePath = getters.paths()['nginx-state'];
	logger.debug('Starting watcher for %s', filePath);

	// Watch state file for changes
	const watcher = watch(filePath, {
		persistent: true,
		ignoreInitial: true,
	});

	// Update SSL cert info
	watcher.on('all', async _event => {
		// Get latest nginx config
		const state = loadState<Partial<NginxIni>>(filePath);

		// Update nginx values
		store.dispatch(updateNginxState({
			ipv4: {
				lan: state?.nginxLanfqdn ?? null,
				wan: state?.nginxWanfqdn ?? null,
			},
			ipv6: {
				lan: state?.nginxLanfqdn6 ?? null,
				wan: state?.nginxWanfqdn6 ?? null,
			},
		}));
	});

	// Save ref for cleanup
	return watcher;
};

export const myservers = () => {
	const watchers: chokidar.FSWatcher[] = [];

	return {
		start() {
			const filePath = getters.paths()['nginx-state'];

			// Check if state file exists
			if (existsSync(filePath)) {
				// If it does exist then let's watch it
				watchers.push(watchStateFile());
			} else {
				logger.error('Nginx state file "%s" is missing', filePath);
			}
		},
		stop() {
			watchers.forEach(async watcher => watcher.close());
		},
	};
};
