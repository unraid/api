/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import chokidar from 'chokidar';
import { coreLogger } from '../log';
import { paths } from '../paths';
import * as Sentry from '@sentry/node';
import { loadState } from '../utils';
import { mothership } from '../../mothership/subscribe-to-servers';
import { apiManager } from '../api-manager';
import { MessageTypes } from 'subscriptions-transport-ws';
import { sockets } from '../../sockets';

export const myservers = () => {
	const watchers: chokidar.FSWatcher[] = [];

	return {
		start() {
			// Watch the my servers config file
			const configFilePath = paths.get('myservers-config')!;

			const watcher = chokidar.watch(configFilePath, {
				persistent: true,
				ignoreInitial: true
			});

			coreLogger.debug('Loading watchers for %s', configFilePath);

			// My servers config has likely changed
			watcher.on('all', async function (_event, fullPath) {
				// Check if crash reporting is enabled
				const file = loadState<{ remote: { sendCrashInfo: string } }>(fullPath);
				const isEnabled = (file.remote.sendCrashInfo ?? 'no').trim() === 'yes';

				// Get Sentry client
				const sentryClient = Sentry.getCurrentHub().getClient();

				// If we have one enable/disable it. If this is
				// missing it's likely we shipped without Sentry
				// initialised. This would be done for a reason!
				if (sentryClient) {
					// Check if the value changed
					if (sentryClient.getOptions().enabled !== isEnabled) {
						sentryClient.getOptions().enabled = isEnabled;

						// Log for debugging
						coreLogger.debug('%s crash reporting!', isEnabled ? 'Enabled' : 'Disabled');
					}
				}

				// Ensure api manager has the correct keys loaded
				await apiManager.checkKey(configFilePath, true);

				// If we have no my_servers key disconnect from mothership's subscription endpoint
				if (apiManager.getValidKeys().filter(key => key.name === 'my_servers').length === 0) {
					// Disconnect forcefully from mothership's subscription endpoint so we ensure it doesn't reconnect automatically
					mothership.close(true, true);
					coreLogger.debug('Disconnected mothership\'s subscription endpoint.');

					// Disconnect from relay
					await sockets.get('relay')?.disconnect(4401);
					coreLogger.debug('Disconnected mothership\'s relay.');
				}

				// If we have a my_servers key reconnect to mothership
				if (apiManager.getValidKeys().filter(key => key.name === 'my_servers').length === 1) {
					// Reconnect to mothership's subscription endpoint
					mothership.connect();
					coreLogger.debug('Reconnecting mothership\'s subscription endpoint.');

					// Reconnect to internal graph
					await sockets.get('internalGraphql')?.connect();
					coreLogger.debug('Reconnecting the internal relay.');

					// Reconnect to relay
					await sockets.get('relay')?.connect();
					coreLogger.debug('Reconnecting mothership\'s relay.');
				}
			});

			// Save ref for cleanup
			watchers.push(watcher);
		},
		stop() {
			watchers.forEach(async watcher => watcher.close());
		}
	};
};
