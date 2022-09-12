import type { Dashboard } from '@app/common/dashboard/generate-data';
import { DashboardPublisher } from '@app/graphql/resolvers/subscription/jobs/dashboard-jobs';

type DashboardCronJobs = ReturnType<typeof DashboardPublisher.init<DashboardPublisher>>;

export const dashboardStore: {
	lastDataPacketTimestamp: number | null;
	lastDataPacket: Dashboard | null;
	lastDataPacketString: string | null;
	connectedToDashboard: number;
	cronJobs: DashboardCronJobs | null;
} = {
	lastDataPacketTimestamp: null,
	lastDataPacket: null,
	lastDataPacketString: null,
	connectedToDashboard: 0,
	cronJobs: null,
};
