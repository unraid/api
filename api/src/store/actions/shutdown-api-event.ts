import { logDestination, logger } from '@app/core/log.js';
import { stopListeners } from '@app/store/listeners/stop-listeners.js';
import { writeConfigSync } from '@app/store/sync/config-disk-sync.js';

export const shutdownApiEvent = () => {
    logger.debug('Running shutdown');
    stopListeners();
    logger.debug('Writing final configs');
    writeConfigSync('flash');
    writeConfigSync('memory');
    logger.debug('Shutting down log destination');
    logDestination.flushSync();
    logDestination.destroy();
};
