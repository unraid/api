/* eslint-disable new-cap */

import { mothershipLogger } from '@app/core';
import { Cron, Expression, Initializer } from '@reflet/cron';
import { Logger } from 'log4js';
import { cloudConnector } from '../cloud-connector';

export class MothershipJobs extends Initializer<typeof MothershipJobs> {
	private readonly logger: Logger;

	constructor() {
		super();
		this.logger = mothershipLogger;
	}

	@Cron(Expression.EVERY_5_MINUTES)
	async logMessage() {
		this.logger.log('You will see this message every 5 minutes');
	}

	@Cron.PreventOverlap
	@Cron(Expression.EVERY_10_SECONDS)
	async checkCloudConnection() {
		try {
			await cloudConnector.checkCloudConnections();
		} catch (error: unknown) {
			this.logger.error('Failed checking connection with error %s.', error);
		}
	}
}

export default new MothershipJobs();
