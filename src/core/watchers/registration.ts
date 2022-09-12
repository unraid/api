/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { FSWatcher, watch } from 'chokidar';
import { logger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { bus } from '@app/core/bus';
import { varState } from '@app/core/states/var';
import { getKeyFile } from '@app/core/utils/misc/get-key-file';

const fileWatchers: FSWatcher[] = [];

let oldData: string;
const publishRegistrationEvent = async (registration: {
	guid: string;
	type: string;
	state: any;
	keyFile: {
		location: string;
		contents: string;
	};
}) => {
	const newData = JSON.stringify(registration, null, 2);

	// Don't publish data if it's the same as the last event
	if (oldData === newData) {
		return;
	}

	// Update cached data
	oldData = newData;

	logger.addContext('data', newData);
	logger.debug('Publishing to "registration"');
	logger.removeContext('data');

	await pubsub.publish('registration', {
		registration,
	}).catch(error => {
		logger.error('Failed publishing to "registration" with %s', error);
	});
};

export const keyFile = () => {
	const listener = async data => {
		// Get key file
		const keyFile = data.var.node.regFile ? await getKeyFile(data.var.node.regFile) : '';
		await publishRegistrationEvent({
			guid: data.var.node.regGuid,
			type: data.var.node.regTy.toUpperCase(),
			state: data.var.node.regState,
			keyFile: {
				location: data.var.node.regFile,
				contents: keyFile,
			},
		});
	};

	return {
		start() {
			// Update registration when regTy, regCheck, etc changes
			bus.on('var', listener);

			// Update registration when key file is updated on disk
			const watcher = watch('/boot/config', {
				persistent: true,
				ignoreInitial: true,
				ignored: (path: string) => !path.endsWith('.key'),
			});

			// Key file has updated, updating registration
			watcher.on('all', async () => {
				// Get key file
				const keyFile = varState.data.regFile ? await getKeyFile(varState.data.regFile) : '';
				await publishRegistrationEvent({
					guid: varState.data.regGuid,
					type: varState.data.regTy.toUpperCase(),
					state: varState.data.regState,
					keyFile: {
						location: varState.data.regFile,
						contents: keyFile,
					},
				});
			});

			// Save ref for cleanup
			fileWatchers.push(watcher);
		},
		stop() {
			bus.removeListener('var', listener);
			fileWatchers.forEach(async watcher => watcher.close());
		},
	};
};
