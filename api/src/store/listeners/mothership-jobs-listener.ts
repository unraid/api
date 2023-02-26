import { startAppListening } from '@app/store/listeners/listener-middleware';
import { isAPIStateDataFullyLoaded } from '@app/mothership/graphql-client';
import { minigraphLogger } from '@app/core/log';
import { MothershipJobs } from '@app/mothership/jobs/cloud-connection-check-jobs';

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

