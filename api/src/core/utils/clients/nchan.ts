/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import xhr2 from 'xhr2';
import windowPolyFill from 'node-window-polyfill';
import { EventSource } from 'launchdarkly-eventsource';
import { nchanLogger } from '@app/core/log';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { beginFileLoadFallback, parsers, updateEmhttpState } from '@app/store/modules/emhttp';
import { getters, store } from '@app/store';

// Load polyfills for nchan
windowPolyFill.register(false);
global.XMLHttpRequest = xhr2;
global.EventSource = EventSource;

// eslint-disable-next-line @typescript-eslint/no-require-imports
import NchanSubscriber = require('nchan');

export const createNchanSubscription = (field: keyof typeof parsers): NchanSubscriber => {
	const emhttp = getters.emhttp();
	const httpPort = emhttp.var.port;
	const endpoint = `${`http://localhost:${httpPort}/sub`}/${field}`;

	const sub = new NchanSubscriber(endpoint, {
		subscriber: 'eventsource',
	});

	sub.on('connect', _event => {
		nchanLogger.debug('Connected to %s', endpoint);
	});

	sub.on('disconnect', async _event => {
		nchanLogger.debug('Disconnected from %s', endpoint);
		try {
			await store.dispatch(beginFileLoadFallback({ message: `Disconnected from ${endpoint}` }));
		} catch (error: unknown) {
			nchanLogger.error('Caught error attempting fallback to file', error);
		}
	});

	sub.on('message', (message: string, _messageMetadata) => {
		try {
			const parser = parsers[field];
			const state = parser(parseConfig({
				file: message,
				type: 'ini',
			}));

			nchanLogger.trace('Received update for %s', field);

			// Update state
			store.dispatch(updateEmhttpState({ field, state }));
		} catch (error: unknown) {
			nchanLogger.error('Failed parsing nchan response for %s with %s', field, error);
		}
	});

	sub.on('error', async (error, error_description) => {
		nchanLogger.error('Error: "%s" \nDescription: "%s"', error, error_description);
		await store.dispatch(beginFileLoadFallback({ message: `Error from ${endpoint}` }));
	});

	sub.reconnect = false;

	sub.start();
	return sub;
};
