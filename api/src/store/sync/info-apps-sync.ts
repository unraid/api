import { isEqual } from 'lodash-es';

import type { StoreSubscriptionHandler } from '@app/store/types.js';
import { logger } from '@app/core/log.js';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { store } from '@app/store/index.js';
import { DaemonConnectionStatus } from '@app/store/types.js';

type InfoAppsEvent = {
    info: {
        apps: {
            installed: number | null;
            running: number | null;
        };
    };
};

export const createInfoAppsEvent = (
    state: Parameters<StoreSubscriptionHandler>[0]
): InfoAppsEvent | null => {
    // Docker state isn't loaded
    if (state === null || state.docker.status === DaemonConnectionStatus.DISCONNECTED) return null;

    return {
        info: {
            apps: {
                installed: state?.docker.installed,
                running: state?.docker.running,
            },
        },
    };
};

export const syncInfoApps: StoreSubscriptionHandler = async (lastState) => {
    const lastEvent = createInfoAppsEvent(lastState);
    const currentEvent = createInfoAppsEvent(store.getState());

    // Skip if either event resolved to null
    if (lastEvent === null || currentEvent === null) return;

    // Skip this if it's the same as the last one
    if (isEqual(lastEvent, currentEvent)) return;

    logger.debug('Docker container count was updated, publishing event');

    // Publish to graphql
    await pubsub.publish(PUBSUB_CHANNEL.INFO, currentEvent);
};
