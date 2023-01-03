/* eslint-disable new-cap */

import { Cron, Expression, Initializer } from '@reflet/cron';
import 'reflect-metadata';
import { publishToDashboard } from '@app/graphql/resolvers/subscription/dashboard';
import { publishNetwork } from '@app/graphql/resolvers/subscription/network';

class DashboardPublisher extends Initializer<typeof DashboardPublisher> {
	@Cron.PreventOverlap
	@Cron(Expression.EVERY_5_SECONDS)
	async publishToDashboardJob() {
		// No need to try catch since publishToDashboard has that handled
		const promises = [publishNetwork, publishToDashboard];
		await Promise.allSettled(promises);
	}
}

const DashboardCronJobs = DashboardPublisher.init();

export const getPublishToDashboardJob = () => DashboardCronJobs.get('publishToDashboardJob');
