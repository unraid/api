import { isEqual } from 'lodash-es';

import { mothershipLogger } from '@app/core/log.js';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { getServers } from '@app/graphql/schema/utils.js';
import { isAPIStateDataFullyLoaded } from '@app/mothership/graphql-client.js';
import { startAppListening } from '@app/store/listeners/listener-middleware.js';
import { FileLoadStatus } from '@app/store/types.js';

export const enableServerStateListener = () =>
    startAppListening({
        predicate: (_, currState, prevState) => {
            if (
                currState.config.status === FileLoadStatus.LOADED &&
                currState.emhttp.status === FileLoadStatus.LOADED
            ) {
                if (
                    prevState.minigraph.status !== currState.minigraph.status ||
                    !isEqual(prevState.config.remote, currState.config.remote)
                ) {
                    return true;
                }
            }
            return false;
        },
        async effect(_, { getState }) {
            if (isAPIStateDataFullyLoaded(getState())) {
                const servers = getServers(getState);
                mothershipLogger.trace('Got local server state', servers);
                if (servers.length > 0) {
                    // Publish owner event
                    await pubsub.publish(PUBSUB_CHANNEL.OWNER, {
                        owner: servers[0].owner,
                    });

                    // Publish servers event
                    await pubsub.publish(PUBSUB_CHANNEL.SERVERS, {
                        servers: servers,
                    });
                }
            }
        },
    });
