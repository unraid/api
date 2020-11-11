/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import chokidar from 'chokidar';
import prettyMilliseconds from 'pretty-ms';
import { paths } from '../paths';
import { log } from '../log';

export const plugins = () => {
	const PLUGIN_RELOAD_TIME_MS = 5000; // 5s
	const pluginsCwd = paths.get('plugins')!;
	const watchers: chokidar.FSWatcher[] = [];
	let timeout;

	const reloadPlugins = () => {
		log.debug(`Reloading plugins as it's been %s since last event.`, prettyMilliseconds(PLUGIN_RELOAD_TIME_MS));

		// Reload plugins
		// core.loaders.plugins();
	};

	return {
		start() {
			// Update plugin manager when plugin files change
			const watcher = chokidar.watch(pluginsCwd, {
				persistent: true,
				ignoreInitial: true,
				ignored: path => ['node_modules'].some(s => path.includes(s))
			});

			log.debug(`Watching ${pluginsCwd}`);

			// Plugin has been deleted, remove from manager
			watcher.on('all', (event, fullPath) => {
				// Reset timeout
				clearTimeout(timeout);

				// Update timeout
				timeout = setTimeout(reloadPlugins, PLUGIN_RELOAD_TIME_MS);
				log.debug('Plugin directory %s has emitted %s event.', fullPath, event);
			});

			// Save ref for cleanup
			watchers.push(watcher);
		},
		stop() {
			watchers.forEach(watcher => watcher.close());
		}
	};
};
