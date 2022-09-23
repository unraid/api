/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import xhr2 from 'xhr2';
import windowPolyFill from 'node-window-polyfill';
import { EventSource } from 'launchdarkly-eventsource';
import { nchanLogger } from '@app/core/log';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { parsers, updateEmhttpState } from '@app/store/modules/emhttp';
import { getters, store } from '@app/store';

// Load polyfills for nchan
windowPolyFill.register(false);
global.XMLHttpRequest = xhr2;
global.EventSource = EventSource;

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const NchanSubscriber = require('nchan');

export const subscribeToNchan = async (field: keyof typeof parsers) => new Promise<void>(resolve => {
	const emhttp = getters.emhttp();
	const httpPort = emhttp.var.port;
	const endpoint = `${`http://localhost:${httpPort}/sub`}/${field}`;

	const sub = new NchanSubscriber(endpoint, {
		subscriber: 'eventsource',
	});

	sub.on('connect', _event => {
		nchanLogger.debug('Connected to %s', endpoint);
		resolve();
	});

	sub.on('disconnect', _event => {
		nchanLogger.debug('Disconnected from %s', endpoint);
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

	sub.on('error', (error, error_description) => {
		nchanLogger.error('Error: "%s" \nDescription: "%s"', error, error_description);
	});

	sub.start();
});
