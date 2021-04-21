/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { promises } from 'fs';
import { dirname } from 'path';
import chokidar from 'chokidar';
import { coreLogger } from '../log';
import { varState } from '../states';
import { pubsub } from '../pubsub';

export const keyFile = () => {
	const watchers: chokidar.FSWatcher[] = [];

	return {
		start() {
			// Watch the directory where the key file is meant to reside
			// This is to ensure we get the key file even if it changes names
			// For example if someone has a Basic.key and then it changes to Pro.key
			const keyDirectory = dirname(varState.data.regFile);

			const watcher = chokidar.watch(keyDirectory, {
				persistent: true,
				ignoreInitial: true
			});

			coreLogger.debug('Loading watchers for %s', keyDirectory);

			// Key file has possibly changed
			watcher.on('all', function (event, fullPath) {
				// Ensure this is a key file
				// @todo Check if varState is updated here if so for an exact match
				//       we can check if the path is varState.data.regFile
				if (!fullPath.endsWith('.key')) {
					return;
				}

				// Allow await inside of this event
				(async () => {
					// Get key file
					const file = await promises.readFile(varState.data.regFile, 'binary');
					const parsedFile = btoa(file).trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

					// Publish event
					// This will end up going to the graphql endpoint
					await pubsub.publish('registration', {
						guid: varState.data.regGuid,
						type: varState.data.regTy,
						keyFile: {
							location: varState.data.regFile,
							contents: parsedFile
						}
					}).catch(error => {
						coreLogger.error('Failed publishing to "registration" with %s', error);
					});
				})();

				// Log for debugging
				coreLogger.debug('Registration file %s has emitted %s event.', fullPath, event);
			});

			// Save ref for cleanup
			watchers.push(watcher);
		},
		stop() {
			watchers.forEach(async watcher => watcher.close());
		}
	};
};
