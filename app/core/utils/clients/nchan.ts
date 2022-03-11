/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import xhr2 from 'xhr2';
import windowPolyFill from 'node-window-polyfill';
import { EventSource } from 'launchdarkly-eventsource';
import * as states from '../../states';
import { nchanLogger } from '../../log';
import { AppError } from '../../errors';
import { parseConfig } from '../misc/parse-config';

// Load polyfills for nchan
windowPolyFill.register(false);
global.XMLHttpRequest = xhr2;
global.EventSource = EventSource;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NchanSubscriber = require('nchan');

const getSubEndpoint = () => {
	const httpPort = states.varState.data?.port;
	return `http://localhost:${httpPort as unknown as string}/sub`;
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
		nchanLogger.debug('Connected to %s', endpoint);
		resolve();
	});

	sub.on('disconnect', function (_event) {
		nchanLogger.debug('Disconnected from %s', endpoint);
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
