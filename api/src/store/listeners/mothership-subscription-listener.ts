import { isEqual } from 'lodash-es';

import { minigraphLogger } from '@app/core/log';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { setupNewMothershipSubscription } from '@app/mothership/subscribe-to-mothership';
import { getMothershipConnectionParams } from '@app/mothership/utils/get-mothership-websocket-headers';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { startAppListening } from '@app/store/listeners/listener-middleware';

export const enableMothershipJobsListener = () =>
    startAppListening({
        predicate(action, currentState, previousState) {
            const newConnectionParams = !isEqual(
                getMothershipConnectionParams(currentState),
                getMothershipConnectionParams(previousState)
            );
            const apiKey = getMothershipConnectionParams(currentState)?.apiKey;

            // This event happens on first app load, or if a user signs out and signs back in, etc
            if (newConnectionParams && apiKey) {
                minigraphLogger.info('Connecting / Reconnecting Mothership Due to Changed Config File');
                return true;
            }

            if (
                setGraphqlConnectionStatus.match(action) &&
                [MinigraphStatus.PING_FAILURE, MinigraphStatus.PRE_INIT].includes(action.payload.status)
            ) {
                minigraphLogger.info(
                    'Reconnecting Mothership - PING_FAILURE / PRE_INIT - SetGraphQLConnectionStatus Event'
                );
                return true;
            }

            return false;
        },
        async effect(_, { getState }) {
            minigraphLogger.trace('Renewing mothership subscription');
            await setupNewMothershipSubscription(getState());
        },
    });
