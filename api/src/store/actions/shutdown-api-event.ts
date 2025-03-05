import { logDestination, logger } from '@app/core/log.js';
import { stopListeners } from '@app/store/listeners/stop-listeners.js';

export const shutdownApiEvent = () => {
    logger.debug('Running shutdown');
    stopListeners();

    logger.debug('Shutting down log destination');
    logDestination.flushSync();
    logDestination.destroy();
};
