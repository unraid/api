/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import chokidar from 'chokidar';
import { logger } from '../log';
import { paths } from '../paths';
import { pki } from 'node-forge';
import { attemptReadFileSync, loadState } from '../utils';
import { apiManager } from '../api-manager';
import { cert, myServersConfig, origins } from '../../server';

export const myservers = () => {
	const watchers: chokidar.FSWatcher[] = [];

	return {
		start() {
			// Get my servers config file path
			const myserversConfigFilePath = paths.get('myservers-config')!;

			// Watch the my servers config file
			logger.debug('Loading watchers for %s', myserversConfigFilePath);
			const myserversConfigWatcher = chokidar.watch(myserversConfigFilePath, {
				persistent: true,
				ignoreInitial: true
			});

			// My servers config has likely changed
			myserversConfigWatcher.on('all', async function (_event, fullPath) {
				const file = loadState<Partial<{
					remote: {
						wanaccess?: string;
						wanport?: string;
						apikey?: string;
						email?: string;
						username?: string;
						avatar?: string;
					};
					api?: {
						'extraOrigins'?: string;
					};
				}>>(fullPath);

				// Only update these if they exist
				if (file.remote) {
					myServersConfig.remote = {
						...(myServersConfig.remote ? myServersConfig.remote : {}),
						wanaccess: file.remote.wanaccess,
						wanport: file.remote.wanport
					};
				}

				if (file?.api?.['extraOrigins'] === 'string') {
					origins.extra = myServersConfig?.api?.['extraOrigins']?.split(',') ?? [];
				}

				try {
					// Ensure api manager has the correct keys loaded
					await apiManager.checkKey(myserversConfigFilePath, true);
				} catch (error: unknown) {
					logger.debug('Failed checking API key with "%s"', (error as Error)?.message || error);
				}
			});

			// Save ref for cleanup
			watchers.push(myserversConfigWatcher);

			// Get cert path
			const sslCertPath = paths.get('ssl-certificate')!;

			// Watch extra origin path for changes
			const sslCertWatcher = chokidar.watch(sslCertPath, {
				persistent: true,
				ignoreInitial: true
			});

			// Update SSL cert info
			sslCertWatcher.on('all', _event => {
				const certPem = attemptReadFileSync(sslCertPath);
				cert.hash = certPem ? pki.certificateFromPem(certPem)?.subject?.attributes?.[0]?.value as string : undefined;
			});
		},
		stop() {
			watchers.forEach(async watcher => watcher.close());
		}
	};
};
