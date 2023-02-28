/* eslint-disable new-cap */

import { mothershipLogger } from '@app/core';
import { Cron, Expression, Initializer } from '@reflet/cron';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { isApiKeyValid } from '@app/store/getters/index';
import { store } from '@app/store/index';
import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';

export class MothershipJobs extends Initializer<typeof MothershipJobs> {
	@Cron.Start()
	@Cron(Expression.EVERY_5_MINUTES)
	async logMessage() {
		mothershipLogger.trace('MothershipJobs Is Still Running (Repeats every 5 minutes)');
	}

	@Cron.Start()
	@Cron.RunOnInit()
	@Cron.PreventOverlap()
	@Cron(Expression.EVERY_30_SECONDS)
	async checkCloudConnection() {
		// @TODO: Convert this to a listener instead of a recurring job.
		// Only need to check API key validity here since the API key validation ensures that state is fully loaded
		const state = store.getState();
		if (isApiKeyValid(state) && state.apiKey.status === API_KEY_STATUS.API_KEY_VALID) {
			const client = GraphQLClient.createSingletonInstance();

			if (!client) {
				mothershipLogger.error('Fatal Error, Client Could Not Be Instantiated');
			}
		}
	}
}
