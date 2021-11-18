/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import chokidar from 'chokidar';
import { log } from '../log';
import { pubsub } from '../pubsub';
import { getKeyFile } from '../utils';
import { bus } from '../bus';
import { varState } from '../states';
import { debounce } from '../../mothership/debounce';

const fileWatchers: chokidar.FSWatcher[] = [];

export const keyFile = () => {
	let oldData: string;
	const listener = async (data: any) => {
		// Log for debugging
		log.debug('Var state updated, publishing registration event.');

		// Get key file
		const keyFile = data.var.node.regFile ? await getKeyFile(data.var.node.regFile) : '';
		const registration = {
			guid: data.var.node.regGuid,
			type: data.var.node.regTy.toUpperCase(),
			state: data.var.node.regState,
			keyFile: {
				location: data.var.node.regFile,
				contents: keyFile
			}
		};

		const newData = JSON.stringify(registration, null, 2);

		// Don't publish data if it's the same as the last event
		if (oldData === newData) {
			return;
		}

		log.addContext('data', newData);
		log.debug('Publishing to "registration"');
		log.removeContext('data');

		// Publish event
		// This will end up going to the graphql endpoint
		await pubsub.publish('registration', {
			registration
		}).catch(error => {
			log.error('Failed publishing to "registration" with %s', error);
		});
	};

	return {
		start() {
			// Update registration when regTy, regCheck, etc changes
			bus.on('var', listener);

			// Update registration when key file is updated on disk
			const watcher = chokidar.watch('/boot/config', {
				persistent: true,
				ignoreInitial: true,
				ignored: (path: string) => !path.endsWith('.key')
			});

			// Key file has updated, updating registration
			watcher.on('all', debounce(async () => {
				// Get key file
				const keyFile = varState.data.regFile ? await getKeyFile(varState.data.regFile) : '';
				const registration = {
					guid: varState.data.regGuid,
					type: varState.data.regTy.toUpperCase(),
					state: varState.data.regState,
					keyFile: {
						location: varState.data.regFile,
						contents: keyFile
					}
				};

				await pubsub.publish('registration', {
					registration
				}).catch(error => {
					log.error('Failed publishing to "registration" with %s', error);
				});
			}, 1_000));

			// Save ref for cleanup
			fileWatchers.push(watcher);
		},
		stop() {
			bus.removeListener('var', listener);
			fileWatchers.forEach(async watcher => watcher.close());
		}
	};
};
