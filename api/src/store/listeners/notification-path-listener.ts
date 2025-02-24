import { logger } from '@app/core/log.js';
import { startAppListening } from '@app/store/listeners/listener-middleware.js';
import { clearAllNotifications } from '@app/store/modules/notifications.js';

export const enableNotificationPathListener = () =>
    startAppListening({
        predicate(_, currentState, previousState) {
            if (
                currentState.dynamix.notify?.path !== '' &&
                previousState.dynamix.notify?.path !== currentState.dynamix.notify?.path
            ) {
                return true;
            }

            return false;
        },
        async effect(_, { dispatch }) {
            logger.debug('Notification Path Changed or Loaded, Recreating Watcher');
            dispatch(clearAllNotifications());
        },
    });
