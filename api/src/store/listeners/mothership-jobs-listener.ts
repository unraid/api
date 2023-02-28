import { startAppListening } from '@app/store/listeners/listener-middleware';
import { isAPIStateDataFullyLoaded } from '@app/mothership/graphql-client';
import { minigraphLogger } from '@app/core/log';
import { MothershipJobs } from '@app/mothership/jobs/cloud-connection-check-jobs';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { subscribeToEvents } from '@app/mothership/subscribe-to-mothership';
import { queryServers } from '@app/store/actions/query-servers';
import { isAnyOf } from '@reduxjs/toolkit';
import { setSubscribedToEvents } from '@app/store/modules/minigraph';

export const enableMothershipJobsListener = () => startAppListening({
	predicate(_, currentState, previousState) {
		if (
			isAPIStateDataFullyLoaded(currentState) && !isAPIStateDataFullyLoaded(previousState)
		) {
			return true;
		}

		return false;
	}, async effect() {
		minigraphLogger.info('Starting Mothership Check Jobs - State is Fully Loaded');
		MothershipJobs.init();
	},
});

const matcher = isAnyOf(setGraphqlConnectionStatus, setSubscribedToEvents);

export const enableMothershipSubscriptionListener = () => startAppListening({
	matcher,
	async effect(action, listenerApi) {
		// Type descrimination
		if (matcher(action)) {
			const state = listenerApi.getState();
			const apiKey = state.config.remote.apikey;
			if (typeof action.payload === 'boolean') {
				if (!action.payload) {
					await subscribeToEvents(apiKey);
					await listenerApi.dispatch(queryServers());
				}
				// GQL Connection status
			} else if (action.payload.status === MinigraphStatus.CONNECTED && apiKey) {
				minigraphLogger.info('[MothershipListener] Subscribing to events');
				await subscribeToEvents(apiKey);
				await listenerApi.dispatch(queryServers());
			}
		}
	},
});
