import { logger } from '@app/core/log';
import { listenerMiddleware } from '@app/store/listeners/listener-middleware';
export const stopListeners = () => {
	logger.debug('Stopping app listeners');
	try {
		listenerMiddleware.clearListeners();
	} catch (error: unknown) {
		logger.warn(error);
	}
};
