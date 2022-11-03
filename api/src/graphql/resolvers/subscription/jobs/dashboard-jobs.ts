/* eslint-disable new-cap */

import { Cron, Expression, Initializer } from '@reflet/cron';
import { publishToDashboard } from '@app/graphql/resolvers/subscription/dashboard';
import 'reflect-metadata';

class DashboardPublisher extends Initializer<typeof DashboardPublisher> {
	@Cron.PreventOverlap
	@Cron(Expression.EVERY_SECOND)
	async publishToDashboardJob() {
		// No need to try catch since publishToDashboard has that handled
		await publishToDashboard();
	}
}

const DashboardCronJobs = DashboardPublisher.init();

export const getPublishToDashboardJob = () => DashboardCronJobs.get('publishToDashboardJob');
