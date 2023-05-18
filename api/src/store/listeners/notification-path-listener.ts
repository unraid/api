import { startAppListening } from '@app/store/listeners/listener-middleware';
import { logger } from '@app/core/log';
import { setupNotificationWatch } from '@app/core/modules/notifications/setup-notification-watch';
import { clearAllNotifications } from '@app/store/modules/notifications';

export const enableNotificationPathListener = () =>
    startAppListening({
        predicate(_, currentState, previousState) {
            if (currentState.dynamix.notify?.path !== '' && previousState.dynamix.notify?.path !== currentState.dynamix.notify?.path) {
                return true;
            }

            return false;
        },
        async effect(_, { dispatch }) {
            logger.debug('Notification Path Changed or Loaded, Recreating Watcher')
            dispatch(clearAllNotifications())
            await setupNotificationWatch()
        },
    });
