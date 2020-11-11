/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import chokidar from 'chokidar';
import waitFor from 'p-wait-for';
import dotProp from 'dot-prop';
import { utils, log, apiManager, paths, pubsub } from './core';
import display from './graphql/resolvers/query/display';

const { validateApiKeyFormat, loadState } = utils;

/**
 * One second in milliseconds.
 */
const ONE_SECOND = 1000;

export const init = async () => {
	const filePath = paths.get('dynamix-config')!;
	const configFilePath = path.join(paths.get('dynamix-base')!, 'case-model.cfg');
	const customImageFilePath = path.join(paths.get('dynamix-base')!, 'case-model.png');
	const getApiKey = () => dotProp.get(loadState(filePath), 'remote.apikey') as string;

	// Wait for api key to be valid
	// We have to use await otherwise the module will keep loading without the apikey being added to the api manager
	await waitFor(() => getApiKey() !== undefined, {
		// Check every 1 second
		interval: ONE_SECOND
	}).then(() => {
		log.debug('Found my_servers apiKey, adding to manager.');

		// Add key to manager
		apiManager.add('my_servers', getApiKey(), {
			userId: '0'
		});
	});

	// Update or remove key when file changes
	chokidar.watch(filePath).on('all', () => {
		// Invalidate old API key
		apiManager.expire('my_servers');

		// Get current API key
		const apiKey = getApiKey();

		// Ensure API key is in the correct format
		try {
			validateApiKeyFormat(apiKey);
		} catch (error) {
			return;
		}

		log.debug('my_servers API key was updated, updating ApiManager.');
		log.debug('Using %s for my_servers API key', apiKey.replace(/./g, '*'));

		process.nextTick(() => {
			// Bail if we have no API key
			if (apiKey === undefined) {
				return;
			}

			// Either add or update the key
			apiManager.add('my_servers', apiKey, {
				userId: '0'
			});
		});
	});

	const updatePubsub = async () => {
		pubsub.publish('display', {
			display: await display()
		});
	};

	// Update pub/sub when config/image file is added/updated/removed
	chokidar.watch(configFilePath).on('all', updatePubsub);
	chokidar.watch(customImageFilePath).on('all', updatePubsub);
};