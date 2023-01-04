/* eslint-disable new-cap */

import { Cron, Expression, Initializer } from '@reflet/cron';
import 'reflect-metadata';
import { publishToDashboard } from '@app/graphql/resolvers/subscription/dashboard';
import { publishNetwork } from '@app/graphql/resolvers/subscription/network';
import { dashboardLogger } from '@app/core';

class DashboardPublisher extends Initializer<typeof DashboardPublisher> {
	@Cron.PreventOverlap
	@Cron(Expression.EVERY_5_SECONDS)
	async publishToDashboardJob() {
		// No need to try catch since publishToDashboard has that handled
		dashboardLogger.trace('Dashboard Publisher is Running')
		const result = await Promise.allSettled([publishNetwork(), publishToDashboard()]);
		if (result.find(res => res.status === 'rejected')) {
			dashboardLogger.error('Error publishing to dashboard %o', result)
		}
	}
}

const DashboardCronJobs = DashboardPublisher.init();

export const getPublishToDashboardJob = () => DashboardCronJobs.get('publishToDashboardJob');
