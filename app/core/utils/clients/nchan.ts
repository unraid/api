/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import fetch from 'node-fetch';
import { debugTimer, parseConfig, sleep } from '..';
import * as states from '../../states';
import { coreLogger } from '../../log';
import { varState } from '../../states';
import { AppError } from '../../errors';

const data = {};

const getSubEndpoint = () => {
	const httpPort = varState.data?.port;
	return `http://localhost:${httpPort}/sub`;
};

export const isNchanUp = async() => {
	const isUp = await fetch(`${getSubEndpoint()}/non-existant`, {
		method: 'HEAD'
	})
		.then(() => true)
		.catch(error => {
			// Socket is up but this endpoint is invalid
			// That's to be expected though.
			if (error.code === 'ECONNRESET') {
				return true;
			}

			return false;
		});

	return isUp;
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

const subscribe = async(endpoint: string) => {
	await sleep(1000).then(async() => {
		debugTimer(`subscribe(${endpoint})`);
		const response = await fetch(`${getSubEndpoint()}/${endpoint}`).catch(async() => {
			// If we throw then let's check if nchan is down
			// or if it's an actual error
			const isUp = await isNchanUp();

			if (isUp) {
				throw new AppError(`Cannot connect to nchan at ${getSubEndpoint()}/${endpoint}`);
			}

			throw new AppError('Cannot connect to nchan');
		});

		if (response.status === 502) {
			// Status 502 is a connection timeout error,
			// may happen when the connection was pending for too long,
			// and the remote server or a proxy closed it
			// let's reconnect
			await subscribe(endpoint);
		} else if (response.status === 200) {
			// Get and show the message
			const message = await response.text();

			// Create endpoint field on data
			if (!data[endpoint]) {
				const fileName = endpoint + '.js';
				data[endpoint] = {
					handlerPath: path.resolve(__dirname, '../../states', fileName)
				};
			}

			// Only re-run parser if the message changed
			if (data[endpoint].message !== message) {
				data[endpoint].updated = new Date();
				data[endpoint].message = message;

				try {
					const state = parseConfig({
						file: message,
						type: 'ini'
					});

					// Update state
					endpointToStateMapping[endpoint].parse(state);
				} catch { }
			}

			debugTimer(`subscribe(${endpoint})`);
		} else {
			// An error - let's show it
			coreLogger.error(JSON.stringify(response));
		}
	}).then(() => {
		subscribe(endpoint);
	});
};

export const subscribeToNchanEndpoint = async(endpoint: string) => {
	if (!Object.keys(endpointToStateMapping).includes(endpoint)) {
		throw new AppError(`Invalid nchan endpoint "${endpoint}".`);
	}

	subscribe(endpoint);
};
