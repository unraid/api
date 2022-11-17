/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { FatalAppError } from '@app/core/errors/fatal-error';
import { graphqlLogger } from '@app/core/log';
import { modules } from '@app/core';
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
