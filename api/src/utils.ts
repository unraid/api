import { logger, mothershipLogger } from '@app/core';
import { getters } from '@app/store';

export const getServers = async () => {
	try {
		logger.debug('Returning cached servers for user');
		return getters.servers().servers;
	} catch (error: unknown) {
		mothershipLogger.addContext('error', error);
		mothershipLogger.error('Failed getting servers', error);
		mothershipLogger.removeContext('error');
	}

	return [];
};
