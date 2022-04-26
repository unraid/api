/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import chokidar from 'chokidar';
import { logger } from '../log';
import { paths } from '../paths';
import { apiManager } from '../api-manager';
import type { MyServersConfig } from '../../types/my-servers-config';
import { existsSync } from 'fs';
import { getNginxState } from '../../common/nginx/get-state';
import { loadState } from '../utils/misc/load-state';
import { pubsub } from '../pubsub';
import { checkTwoFactorEnabled } from '../../common/two-factor';
import { nginx, origins } from '../../common/allowed-origins';
import { myServersConfig } from '../../common/myservers-config';

const watchConfigFile = () => {
	// Get myservers config
	const configPath = paths['myservers-config'];

	logger.debug('Starting watcher for %s', configPath);

	// Watch the my servers config file
	const watcher = chokidar.watch(configPath, {
		persistent: true,
		ignoreInitial: true
	});

	// My servers config has likely changed
	watcher.on('all', async function (_event, fullPath) {
		const file = loadState<Partial<MyServersConfig>>(fullPath);

		logger.addContext('config', file);
		logger.trace('"%s" was updated', fullPath);
		logger.removeContext('config');

		// Update remote section for remote access
		if (file?.remote) {
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
		if (file?.local) {
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
		if (typeof file?.api?.extraOrigins === 'string' && file?.api?.extraOrigins !== myServersConfig.api?.extraOrigins) {
			logger.debug('Extra origins updated origins="%s"', file?.api?.extraOrigins ?? '');
			origins.extra = file?.api?.extraOrigins?.split(',') ?? [];
		}

		const { isRemoteEnabled, isLocalEnabled } = checkTwoFactorEnabled();

		// Publish to 2fa endpoint
		await pubsub.publish('twoFactor', {
			twoFactor: {
				remote: {
					enabled: isRemoteEnabled
				},
				local: {
					enabled: isLocalEnabled
				}
			}
		});

		try {
			// Ensure api manager has the correct keys loaded
			await apiManager.checkKey(configPath, true);
		} catch (error: unknown) {
			logger.debug('Failed checking API key with "%s"', (error as Error)?.message || error);
		}
	});

	// Save ref for cleanup
	return watcher;
};

const watchStateFile = () => {
	// State file path
	const filePath = paths['nginx-state'];
	logger.debug('Starting watcher for %s', filePath);

	// Watch state file for changes
	const watcher = chokidar.watch(filePath, {
		persistent: true,
		ignoreInitial: true
	});

	// Update SSL cert info
	watcher.on('all', _event => {
		// Update nginx values
		const nginxState = getNginxState();
		nginx.lan = nginxState.lan;
		nginx.wan = nginxState.wan;

		// Update remote access details
		const configPath = paths['myservers-config'];
		const file = loadState<Partial<MyServersConfig>>(configPath) ?? {};
		if (!myServersConfig.remote) myServersConfig.remote = {};
		myServersConfig.remote = file.remote;
	});

	// Save ref for cleanup
	return watcher;
};

export const myservers = () => {
	const watchers: chokidar.FSWatcher[] = [];

	return {
		start() {
			const filePath = paths['nginx-state'];

			// Watch config file for changes to 2fa
			watchers.push(watchConfigFile());

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
		}
	};
};
