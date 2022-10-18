/* eslint-disable new-cap */

import { mothershipLogger } from '@app/core';
import { Cron, Expression, Initializer } from '@reflet/cron';
import { cloudConnector } from '../cloud-connector';
import { updateConnectionStatusInConfig } from '@app/mothership/update-connection-status-in-config';

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
		try {
			await cloudConnector.checkCloudConnections();
		} catch (error: unknown) {
			mothershipLogger.error('Failed checking connection with error %s.', error);
		}

		try {
			await updateConnectionStatusInConfig();
		} catch (error: unknown) {
			mothershipLogger.error('Failed to update the config with the connection status %s.', error);
		}
	}
}

