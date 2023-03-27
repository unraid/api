import { logger } from '@app/core/log';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { DynamicRemoteAccessType } from '@app/remoteAccess/types';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { store } from '@app/store/index';
import { stopListeners } from '@app/store/listeners/stop-listeners';
import { setWanAccess } from '@app/store/modules/config';
import { writeConfigSync } from '@app/store/sync/config-disk-sync';

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
};
