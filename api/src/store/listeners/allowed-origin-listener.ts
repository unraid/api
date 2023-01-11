import { startAppListening } from '@app/store/listeners/listener-middleware';
import { updateAllowedOrigins } from '@app/store/modules/config';
import isEqual from 'lodash/isEqual';
import { getAllowedOrigins } from '@app/common/allowed-origins';
import { logger } from '@app/core';
import { FileLoadStatus } from '@app/store/types';

export const enableAllowedOriginListener = () => startAppListening({
	predicate(_, currentState, previousState) {
		if (currentState.emhttp.status !== FileLoadStatus.LOADED || currentState.config.status !== FileLoadStatus.LOADED) {
			return false;
		}

		if (isEqual(currentState.emhttp.nginx, previousState?.emhttp?.nginx) && isEqual(currentState.config.remote.wanport, previousState.config.remote.wanport)) {
			return false;
		}

		return true;
	}, async effect(_, { getState, dispatch }) {
		logger.debug('Updating allowed origins', getAllowedOrigins(getState()));
		const allowedOrigins = getAllowedOrigins(getState());
		dispatch(updateAllowedOrigins(allowedOrigins));
	},
});

