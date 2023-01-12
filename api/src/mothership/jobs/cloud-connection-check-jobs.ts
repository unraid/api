/* eslint-disable new-cap */

import { mothershipLogger } from '@app/core';
import { Cron, Expression, Initializer } from '@reflet/cron';
import { isAPIStateDataFullyLoaded } from '@app/mothership/graphql-client';
import { subscribeToMothership } from '@app/mothership/subscribe-to-mothership';
import { isApiKeyValid } from '@app/store/getters/index';

export class MothershipJobs extends Initializer<typeof MothershipJobs> {
	@Cron.Start()
	@Cron(Expression.EVERY_5_MINUTES)
	async logMessage() {
		mothershipLogger.trace('MothershipJobs Is Still Running (Repeats every 5 minutes)');
	}

	@Cron.Start()
	@Cron.PreventOverlap
	@Cron(Expression.EVERY_10_SECONDS)
	async checkCloudConnection() {
		// @TODO: Convert this to a listener instead of a recurring job.
		if (isAPIStateDataFullyLoaded() && isApiKeyValid()) {
			try {
				await subscribeToMothership();
			} catch (error: unknown) {
				mothershipLogger.error('Failed checking connection with error %s.', error);
			}
		}
	}
}

