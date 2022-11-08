/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { FatalAppError } from '@app/core/errors/fatal-error';
import { DockerEventEmitter } from '@gridplus/docker-events';
import { User } from '@app/core/types/states/user';
import { dockerLogger, graphqlLogger, logger } from '@app/core/log';
import { modules } from '@app/core';
import { pubsub } from '@app/core/pubsub';
import { getters } from '@app/store';

export const getCoreModule = (moduleName: string) => {
	if (!Object.keys(modules).includes(moduleName)) {
		throw new FatalAppError(`"${moduleName}" is not a valid core module.`);
	}

	return modules[moduleName];
};

export const apiKeyToUser = async (apiKey: string) => {
	try {
		const config = getters.config();
		if (apiKey === config.remote.apikey) return { id: -1, description: 'My servers service account', name: 'my_servers', role: 'my_servers' };
		if (apiKey === config.upc.apikey) return { id: -1, description: 'UPC service account', name: 'upc', role: 'upc' };
		if (apiKey === config.notifier.apikey) return { id: -1, description: 'Notifier service account', name: 'notifier', role: 'notifier' };
	} catch (error: unknown) {
		graphqlLogger.debug('Failed looking up API key with "%s"', (error as Error).message);
	}

	return { id: -1, description: 'A guest user', name: 'guest', role: 'guest' };
};

// Only watch container events equal to start/stop
const watchedEvents = [
	'die',
	'kill',
	'oom',
	'pause',
	'restart',
	'start',
	'stop',
	'unpause',
].map(event => `event=${event}`);

// Create docker event emitter instance
logger.addContext('events', watchedEvents);
logger.debug('Creating docker event emitter instance');
logger.removeContext('events');

// @TODO: Move this to store
const dee = new DockerEventEmitter(watchedEvents);

// On Docker event update info with { apps: { installed, started } }
dee.on('*', async (data: { Type: 'container'; Action: 'start' | 'stop'; from: string }) => {
	// Only listen to container events
	if (data.Type !== 'container') {
		dockerLogger.debug(`[${data.Type as string}] ${data.from} ${data.Action}`);
		return;
	}

	dockerLogger.addContext('data', data);
	dockerLogger.debug(`[${data.from}] ${data.Type}->${data.Action}`);
	dockerLogger.removeContext('data');

	const user: User = { id: '-1', description: 'Internal service account', name: 'internal', role: 'admin', password: false };
	const { json } = await modules.getAppCount({ user });
	await pubsub.publish('info', {
		info: {
			apps: json,
		},
	});
});

logger.debug('Binding to docker events');
dee.listen();
