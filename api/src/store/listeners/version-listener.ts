import { logger } from '@app/core/log';
import { API_VERSION } from '@app/environment';
import { startAppListening } from '@app/store/listeners/listener-middleware';
import { updateUserConfig } from '@app/store/modules/config';
import { FileLoadStatus } from '@app/store/types';

export const enableVersionListener = () => startAppListening({
	predicate(_, currentState) {
		if (currentState.config.status === FileLoadStatus.LOADED && (currentState.config.api.version === '' || currentState.config.api.version !== API_VERSION)) {
			logger.trace('Config Loaded, setting API Version in myservers.cfg');
			return true;
		}

		return false;
	}, async effect(_, { dispatch }) {
		dispatch(updateUserConfig({
			api: { version: API_VERSION },
		}));
	},
});

