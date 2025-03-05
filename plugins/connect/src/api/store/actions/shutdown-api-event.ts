import { logDestination, logger } from '@app/core/log.js';
import { DynamicRemoteAccessType, MinigraphStatus } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status.js';
import { store } from '@app/store/index.js';
import { stopListeners } from '@app/store/listeners/stop-listeners.js';
import { setWanAccess } from '@app/store/modules/config.js';
import { writeConfigSync } from '@app/store/sync/config-disk-sync.js';

export const shutdownApiEvent = () => {
    logger.debug('Running shutdown');
    stopListeners();
    store.dispatch(setGraphqlConnectionStatus({ status: MinigraphStatus.PRE_INIT, error: null }));
    if (store.getState().config.remote.dynamicRemoteAccessType !== DynamicRemoteAccessType.DISABLED) {
        store.dispatch(setWanAccess('no'));
    }

    logger.debug('Writing final configs');
    writeConfigSync('flash');
    writeConfigSync('memory');
    logger.debug('Shutting down log destination');
    logDestination.flushSync();
    logDestination.destroy();
};
