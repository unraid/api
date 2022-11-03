import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DashboardPublisher } from '@app/graphql/resolvers/subscription/jobs/dashboard-jobs';
import { dashboardLogger } from '@app/core/log';
import { Dashboard } from '@app/common/run-time/dashboard';

type DashboardCronJobs = ReturnType<typeof DashboardPublisher.init<DashboardPublisher>>;

interface DashboardState {
	lastDataPacketTimestamp: number | null;
	lastDataPacket: Dashboard | null;
	connectedToDashboard: number;
	cronJobs: DashboardCronJobs;
}

export const initialState: DashboardState = {
	lastDataPacketTimestamp: null,
	lastDataPacket: null,
	connectedToDashboard: 0,
	cronJobs: DashboardPublisher.init(),
};

export const dashboard = createSlice({
	name: 'dashboard',
	initialState,
	reducers: {
		startDashboardProducer(state) {
			state.connectedToDashboard += 1;

			// Start new producer
			dashboardLogger.trace('Starting dashboard producer');
			state.cronJobs.get('publishToDashboardJob')!.start();
		},

		stopDashboardProducer(state) {
			state.connectedToDashboard -= 1;

			// Don't stop if we still have clients using this
			if (state.connectedToDashboard >= 1) return;

			state.cronJobs.get('publishToDashboardJob')!.stop();
			state.lastDataPacket = null;
			state.lastDataPacketTimestamp = null;
		},
		saveDataPacket(state, action: PayloadAction<{ lastDataPacket: Dashboard | null }>) {
			state.lastDataPacket = action.payload.lastDataPacket;
			state.lastDataPacketTimestamp = Date.now();
		},
	},
});

export const { startDashboardProducer, stopDashboardProducer, saveDataPacket } = dashboard.actions;
