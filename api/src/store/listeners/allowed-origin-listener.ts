import { startAppListening } from '@app/store/listeners/listener-middleware';
import { updateAllowedOrigins } from '@app/store/modules/config';
import isEqual from 'lodash/isEqual';
import { getAllowedOrigins } from '../../common/allowed-origins';
import { logger } from '@app/core';

export const enableAllowedOriginListener = () => startAppListening({
	predicate(_, currentState, previousState) {
		if (isEqual(currentState.emhttp.nginx, previousState?.emhttp?.nginx)) {
			return false;
		}

		return true;
	}, async effect(_, { getState, dispatch }) {
		logger.debug('Updating allowed origins', getAllowedOrigins(getState()));
		const allowedOrigins = getAllowedOrigins(getState());
		dispatch(updateAllowedOrigins(allowedOrigins));
	},
});

