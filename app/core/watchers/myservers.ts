/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import chokidar from 'chokidar';
import { logger } from '../log';
import { paths } from '../paths';
import { loadState } from '../utils';
import { apiManager } from '../api-manager';
import { cert, nginx, origins } from '../../server';
import { getCerts } from '../../common/get-certs';
import { MyServersConfig } from '../../types/my-servers-config';
import { pubsub } from '..';
import { existsSync } from 'fs';
import { getNginxState } from '../../common/nginx/get-state';

// Get myservers config
const configPath = paths.get('myservers-config')!;
export const myServersConfig = loadState<Partial<MyServersConfig>>(configPath) ?? {};

const watchCertsDirectory = () => {
	// Get cert directory
	const directory = paths.get('ssl-certificate-directory')!;
	logger.debug('Starting watcher for %s', directory);

	// Watch ssl certs path for changes
	const watcher = chokidar.watch(directory, {
		persistent: true,
		ignoreInitial: true
	});

	// Update SSL cert info
	watcher.on('all', _event => {
		const newCerts = getCerts();
		cert.nonWildcard = newCerts.nonWildcard;
		cert.wildcard = newCerts.wildcard;
		cert.userProvided = newCerts.userProvided;
	});

	// Save ref for cleanup
	return watcher;
};

const watchConfigFile = () => {
	// Get my servers config file path
	const filePath = paths.get('myservers-config')!;
	logger.debug('Starting watcher for %s', filePath);

	// Watch the my servers config file
	const watcher = chokidar.watch(filePath, {
		persistent: true,
		ignoreInitial: true
	});

	// My servers config has likely changed
	watcher.on('all', async function (_event, fullPath) {
		const file = loadState<Partial<MyServersConfig>>(fullPath);

		// Update remote section for remote access
		if (file.remote) {
			// If 2fa was enabled/disabled comment on it changing
			if (myServersConfig.remote?.['2Fa'] && myServersConfig.remote?.['2Fa'] !== file.remote['2Fa']) {
				logger.debug('Remote 2FA status="%s" type="%s"', file.remote['2Fa'] === 'yes' ? 'enabled' : 'disabled', 'transparent');
			}

			myServersConfig.remote = {
				...(myServersConfig.remote ? myServersConfig.remote : {}),
				wanaccess: file.remote.wanaccess,
				wanport: file.remote.wanport,
				'2Fa': file.remote['2Fa']
			};
		}

		// Update local section for LAN access
		if (file.local) {
			// If 2fa was enabled/disabled comment on it changing
			if (myServersConfig.remote?.['2Fa'] && myServersConfig.local?.['2Fa'] !== file.local['2Fa']) {
				logger.debug('Local 2FA status="%s" type="%s"', file.local['2Fa'] === 'yes' ? 'enabled' : 'disabled', 'transparent');
			}

			myServersConfig.local = {
				...(myServersConfig.local ? myServersConfig.local : {}),
				'2Fa': file.local['2Fa']
			};
		}

		// Update extra origins for CORS
		if (typeof file?.api?.extraOrigins === 'string') {
			logger.debug('Extra origins updated origins="%s"', myServersConfig?.api?.extraOrigins);
			origins.extra = myServersConfig?.api?.extraOrigins?.split(',') ?? [];
		}

		// Publish to 2fa endpoint
		await pubsub.publish('twoFactor', {
			twoFactor: {
				remote: {
					enabled: myServersConfig.remote?.['2Fa'] === 'yes'
				},
				local: {
					enabled: myServersConfig.local?.['2Fa'] === 'yes'
				}
			}
		});

		try {
			// Ensure api manager has the correct keys loaded
			await apiManager.checkKey(filePath, true);
		} catch (error: unknown) {
			logger.debug('Failed checking API key with "%s"', (error as Error)?.message || error);
		}
	});

	// Save ref for cleanup
	return watcher;
};

const watchStateFile = () => {
	// State file path
	const filePath = paths.get('nginx-state')!;
	logger.debug('Starting watcher for %s', filePath);

	// Watch state file for changes
	const watcher = chokidar.watch(filePath, {
		persistent: true,
		ignoreInitial: true
	});

	// Update SSL cert info
	watcher.on('all', _event => {
		const nginxState = getNginxState();
		nginx.lan = nginxState.lan;
		nginx.wan = nginxState.wan;
	});

	// Save ref for cleanup
	return watcher;
};

export const myservers = () => {
	const watchers: chokidar.FSWatcher[] = [];

	return {
		start() {
			const filePath = paths.get('nginx-state')!;

			// Watch config file for changes to 2fa
			watchers.push(watchConfigFile());

			// Check if state file exists
			// If it does then let's process that
			if (existsSync(filePath)) {
				watchers.push(watchStateFile());
			} else {
				// Otherwise fallback to checking the certs
				watchers.push(watchCertsDirectory());
			}
		},
		stop() {
			watchers.forEach(async watcher => watcher.close());
		}
	};
};
