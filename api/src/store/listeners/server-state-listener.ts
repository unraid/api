import { mothershipLogger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { getServers } from '@app/graphql/schema/utils';
import { isAPIStateDataFullyLoaded } from '@app/mothership/graphql-client';
import { startAppListening } from '@app/store/listeners/listener-middleware';
import { FileLoadStatus } from '@app/store/types';

import isEqual from 'lodash/isEqual';

export const enableServerStateListener = () =>
    startAppListening({
        predicate: (_, currState, prevState) => {
            if (currState.config.status === FileLoadStatus.LOADED && currState.emhttp.status === FileLoadStatus.LOADED ) {
                if (prevState.minigraph.status !== currState.minigraph.status || !isEqual(prevState.config.remote, currState.config.remote)) {
                    return true;
                }
            }
            return false;
        },
        async effect(_, { getState }) {
            if (isAPIStateDataFullyLoaded(getState())) {
                const servers = getServers(getState);
                mothershipLogger.trace(
                    'Got local server state %o',
                    servers
                );
                if (servers.length > 0) {
                    // Publish owner event
                    await pubsub.publish('owner', {
                        owner: servers[0].owner,
                    });

                    // Publish servers event
                    await pubsub.publish('servers', {
                        servers: servers,
                    });
                }
            }
        },
    });
