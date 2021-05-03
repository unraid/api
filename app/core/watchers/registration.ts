/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { dirname } from 'path';
import chokidar from 'chokidar';
import { coreLogger, logger } from '../log';
import { varState } from '../states';
import { pubsub } from '../pubsub';
import { getKeyFile, sleep } from '../utils';
import { bus } from '../bus';

const processChange = async function () {
	logger.debug(varState.data.regFile ? `Checking "${varState.data.regFile}" for the key file.` : 'No key file found.');

	// Get key file
	const keyFile = varState.data.regFile ? await getKeyFile() : '';
	const registration = {
		guid: varState.data.regGuid,
		type: varState.data.regTy.toUpperCase(),
		state: varState.data.regState,
		keyFile: {
			location: varState.data.regFile,
			contents: keyFile
		}
	};

	logger.debug('Publishing %s to registration', JSON.stringify(registration, null, 2));

	// Publish event
	// This will end up going to the graphql endpoint
	await pubsub.publish('registration', {
		registration
	}).catch(error => {
		coreLogger.error('Failed publishing to "registration" with %s', error);
	});
};

export const keyFile = () => {
	const watchers: chokidar.FSWatcher[] = [];

	return {
		// All up this should wait no more than 750ms between either a file add/unlink event or a varState change event
		// and it emitting the registation event
		start() {
			// Watch the directory where the key file is meant to reside
			// This is to ensure we get the key file even if it changes names
			// For example if someone has a Basic.key and then it changes to Pro.key
			const keyDirectory = dirname(varState.data.regFile);

			const watcher = chokidar.watch(keyDirectory, {
				persistent: true,
				ignoreInitial: true,
				awaitWriteFinish: {
					// Every 1/10 of a second poll
					// If the size stays the same for 0.5s then emit the event
					pollInterval: 100,
					stabilityThreshold: 500
				}
			});

			coreLogger.debug('Loading watchers for %s', keyDirectory);

			// Key file has possibly changed
			watcher.on('all', async (event, filePath) => {
				// Wait 250ms to ensure varState has settled with the new value
				await sleep(250);

				// Log for debugging
				coreLogger.debug('Registration file %s has emitted %s event.', filePath, event);

				// Valid key file added
				if (event === 'add' && filePath === varState.data.regFile) {
					// Process the changes
					await processChange().catch(error => {
						coreLogger.error('Failed processing watcher "%s" event with %s', event, error);
					});
				}

				// Key file removed
				if (event === 'unlink') {
					// Process the changes
					await processChange().catch(error => {
						coreLogger.error('Failed processing watcher "%s" event with %s', event, error);
					});
				}
			});

			// Save ref for cleanup
			watchers.push(watcher);

			// Update registration when regTy, regCheck, etc changes
			bus.on('varstate', async () => {
				// Wait 250ms to ensure varState has settled with the new value
				await sleep(100);

				// Log for debugging
				coreLogger.debug('Var state updated, publishing registration event.');

				// Process the changes
				await processChange().catch(error => {
					coreLogger.error('Failed processing bus update for "varState" with %s', error);
				});
			});
		},
		stop() {
			watchers.forEach(async watcher => watcher.close());
		}
	};
};
