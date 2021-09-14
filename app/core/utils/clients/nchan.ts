/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import xhr2 from 'xhr2';
import windowPolyFill from 'node-window-polyfill';
import { EventSource } from 'launchdarkly-eventsource';
import { parseConfig } from '..';
import * as states from '../../states';
import { log } from '../../log';
import { AppError } from '../../errors';

const nchanLogger = log.createChild({
	prefix: 'nchan'
});

// Load polyfills for nchan
windowPolyFill.register(false);
global.XMLHttpRequest = xhr2;
global.EventSource = EventSource;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NchanSubscriber = require('nchan');

const getSubEndpoint = () => {
	const httpPort: string = states.varState.data?.port;
	return `http://localhost:${httpPort}/sub`;
};

const endpointToStateMapping = {
	// Cpuload: ,
	devs: states.devicesState,
	// Diskload: ,
	disks: states.slotsState,
	// Monitor: ,
	network: states.networkState,
	sec: states.smbSecState,
	sec_nfs: states.nfsSecState,
	shares: states.sharesState,
	users: states.usersState,
	var: states.varState
};

const subscribe = async (endpoint: string) => new Promise<void>(resolve => {
	const sub = new NchanSubscriber(`${getSubEndpoint()}/${endpoint}`, {
		subscriber: 'eventsource'
	});

	sub.on('connect', function (_event) {
		nchanLogger.debug('NCHAN:CONNECTED:%s', endpoint);
		resolve();
	});

	sub.on('message', function (message, _messageMetadata) {
		try {
			const state = parseConfig({
				file: message,
				type: 'ini'
			});

			// Update state
			endpointToStateMapping[endpoint].parse(state);
		} catch {}
	});

	sub.on('error', function (error, error_description) {
		nchanLogger.error('Error: "%s" \nDescription: "%s"', error, error_description);
	});

	sub.start();
});

export const subscribeToNchanEndpoint = async (endpoint: string) => {
	if (!Object.keys(endpointToStateMapping).includes(endpoint)) {
		throw new AppError(`Invalid nchan endpoint "${endpoint}".`);
	}

	// Subscribe
	await subscribe(endpoint);
};
