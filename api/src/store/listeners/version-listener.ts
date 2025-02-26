import { logger } from '@app/core/log.js';
import { API_VERSION } from '@app/environment.js';
import { startAppListening } from '@app/store/listeners/listener-middleware.js';
import { updateUserConfig } from '@app/store/modules/config.js';
import { FileLoadStatus } from '@app/store/types.js';

export const enableVersionListener = () =>
    startAppListening({
        predicate(_, currentState) {
            if (
                currentState.config.status === FileLoadStatus.LOADED &&
                (currentState.config.api.version === '' ||
                    currentState.config.api.version !== API_VERSION)
            ) {
                logger.trace('Config Loaded, setting API Version in myservers.cfg to ', API_VERSION);
                return true;
            }

            return false;
        },
        async effect(_, { dispatch }) {
            dispatch(
                updateUserConfig({
                    api: { version: API_VERSION },
                })
            );
        },
    });
