import { startAppListening } from '@app/store/listeners/listener-middleware';
import { subscribeToEvents } from '@app/mothership/subscribe-to-mothership';
import { queryServers } from '@app/store/actions/query-servers';
import { getMothershipConnectionParams } from '@app/mothership/utils/get-mothership-websocket-headers';
import isEqual from 'lodash/isEqual';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { minigraphLogger } from '@app/core/log';

export const enableMothershipJobsListener = () => startAppListening({
	predicate(action, currentState, previousState) {
		// This event happens on first app load, or if a user signs out and signs back in, etc
		if (!isEqual(getMothershipConnectionParams(currentState), getMothershipConnectionParams(previousState))) {
			minigraphLogger.info('Connecting / Reconnecting Mothership Due to Changed Config File or First Load')
			return true;
		}

		if (setGraphqlConnectionStatus.match(action) && [MinigraphStatus.PING_FAILURE, MinigraphStatus.PRE_INIT].includes(action.payload.status)) {
			minigraphLogger.info('Reconnecting Mothership - PING_FAILURE / PRE_INIT - SetGraphQLConnectionStatus Event')
			return true;
		}

		return false;
	}, async effect(action, { getState, dispatch }) {
		await GraphQLClient.clearInstance();
		if (getMothershipConnectionParams(getState()).apiKey) {
			const client = GraphQLClient.createSingletonInstance();
			if (client) {
				await subscribeToEvents(getState().config.remote.apikey);
				await dispatch(queryServers());
			}

		}
	},
});
