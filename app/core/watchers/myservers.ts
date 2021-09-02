/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import chokidar from 'chokidar';
import { coreLogger } from '../log';
import { paths } from '../paths';
import * as Sentry from '@sentry/node';
import { pki } from 'node-forge';
import { attemptJSONParse, attemptReadFileSync, loadState } from '../utils';
import { apiManager } from '../api-manager';
import { cert, myServersConfig, origins } from '../../server';

export const myservers = () => {
	const watchers: chokidar.FSWatcher[] = [];

	return {
		start() {
			// Get my servers config file path
			const myserversConfigFilePath = paths.get('myservers-config')!;

			// Watch the my servers config file
			coreLogger.debug('Loading watchers for %s', myserversConfigFilePath);
			const myserversConfigWatcher = chokidar.watch(myserversConfigFilePath, {
				persistent: true,
				ignoreInitial: true
			});

			// My servers config has likely changed
			myserversConfigWatcher.on('all', async function (_event, fullPath) {
				// Check if crash reporting is enabled
				const file = loadState<{ remote: { wanaccess: string; wanport: string; sendCrashInfo: string } }>(fullPath);
				const isEnabled = (file.remote.sendCrashInfo ?? 'no').trim() === 'yes';

				// Get Sentry client
				const sentryClient = Sentry.getCurrentHub().getClient();

				// If we have one enable/disable it. If this is
				// missing it's likely we shipped without Sentry
				// initialized. This would be done for a reason!
				if (sentryClient && // Check if the value changed
					sentryClient.getOptions().enabled !== isEnabled) {
					sentryClient.getOptions().enabled = isEnabled;

					// Log for debugging
					coreLogger.debug('%s crash reporting!', isEnabled ? 'Enabled' : 'Disabled');
				}

				// @todo: add cfg files similar to states
				// Update myservers config, this is used for origin checks in graphql
				myServersConfig.remote.wanaccess = file.remote.wanaccess;
				myServersConfig.remote.wanport = file.remote.wanport;

				// Ensure api manager has the correct keys loaded
				await apiManager.checkKey(myserversConfigFilePath, true);
			});

			// Save ref for cleanup
			watchers.push(myserversConfigWatcher);

			// Get extra origin path
			const extraOriginPath = paths.get('extra-origins')!;

			// Watch extra origin path for changes
			const extraOriginsWatcher = chokidar.watch(extraOriginPath, {
				persistent: true,
				ignoreInitial: true
			});

			// Extra origins file has likely updated
			extraOriginsWatcher.on('all', async _event => {
				origins.extra = extraOriginPath ? attemptJSONParse(attemptReadFileSync(extraOriginPath, ''), []) : [];
			});

			// Get cert path
			const sslCertPath = paths.get('ssl-certificate')!;

			// Watch extra origin path for changes
			const sslCertWatcher = chokidar.watch(sslCertPath, {
				persistent: true,
				ignoreInitial: true
			});

			// Update SSL cert info
			sslCertWatcher.on('all', event => {
				const certPem = attemptReadFileSync(sslCertPath);
				cert.hash = certPem ? pki.certificateFromPem(certPem)?.subject?.attributes?.[0]?.value as string : undefined;
			});
		},
		async stop() {
			await Promise.all(watchers.map(async watcher => watcher.close()));
		}
	};
};
