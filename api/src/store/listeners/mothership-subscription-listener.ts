import { startAppListening } from '@app/store/listeners/listener-middleware';
import { subscribeToEvents } from '@app/mothership/subscribe-to-mothership';
import { queryServers } from '@app/store/actions/query-servers';
import { getMothershipConnectionParams } from '@app/mothership/utils/get-mothership-websocket-headers';
import isEqual from 'lodash/isEqual';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { MinigraphStatus } from '@app/graphql/generated/api/types';

export const enableMothershipJobsListener = () => startAppListening({
	predicate(_, currentState, previousState) {
		if (!isEqual(getMothershipConnectionParams(currentState), getMothershipConnectionParams(previousState))) {
			return true;
		}

		if ([MinigraphStatus.PING_FAILURE, MinigraphStatus.PRE_INIT].includes(currentState.minigraph.status) && previousState.minigraph.status === MinigraphStatus.CONNECTED) {
			// Failed a fatal health check, rebuild the client
			return true;
		}

		return false;
	}, async effect(action, { getState, dispatch }) {
		await GraphQLClient.clearInstance();
		if (getMothershipConnectionParams(getState()).apiKey) {
			const client = GraphQLClient.createSingletonInstance();
			if (client) {
				await subscribeToEvents(getState().config.remote.apikey);
			}

			await dispatch(queryServers());
		}
	},
});
