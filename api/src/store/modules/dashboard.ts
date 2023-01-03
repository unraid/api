import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getPublishToDashboardJob } from '@app/mothership/jobs/dashboard-jobs';
import { dashboardLogger } from '@app/core/log';
import { type NetworkInput, type DashboardInput } from '@app/graphql/generated/client/graphql';

interface DashboardState {
	lastDataPacketTimestamp: number | null;
	lastDataPacket: DashboardInput | null;
	lastNetworkPacket: NetworkInput | null;
	lastNetworkPacketTimestamp: number | null;
	connectedToDashboard: number;
}

export const initialState: DashboardState = {
	lastDataPacketTimestamp: null,
	lastDataPacket: null,
	lastNetworkPacket: null,
	lastNetworkPacketTimestamp: null,
	connectedToDashboard: 0,
};

export const dashboard = createSlice({
	name: 'dashboard',
	initialState,
	reducers: {
		startDashboardProducer(state) {
			dashboardLogger.trace('Starting Publisher - clients connected before: %s', state.connectedToDashboard);
			state.connectedToDashboard += 1;

			// It's already been started
			if (state.connectedToDashboard >= 2) return;

			// Start new producer
			dashboardLogger.trace('Starting dashboard producer');
			getPublishToDashboardJob().start();
		},

		stopDashboardProducer(state) {
			dashboardLogger.trace('Stopping Publisher - clients connected before: %s', state.connectedToDashboard);
			state.connectedToDashboard -= 1;
			// Make sure we don't go negative
			if (state.connectedToDashboard < 0) state.connectedToDashboard = 0;

			// Don't stop if we still have clients using this
			if (state.connectedToDashboard >= 1) return;

			getPublishToDashboardJob().stop();
		},
		saveDataPacket(state, action: PayloadAction<{ lastDataPacket: DashboardInput | null }>) {
			state.lastDataPacket = action.payload.lastDataPacket;
			state.lastDataPacketTimestamp = Date.now();
		},
		saveNetworkPacket(state, action: PayloadAction<{ lastNetworkPacket: NetworkInput | null }>) {
			state.lastNetworkPacket = action.payload.lastNetworkPacket;
			state.lastNetworkPacketTimestamp = Date.now();
		},
	},
});

export const { startDashboardProducer, stopDashboardProducer, saveDataPacket, saveNetworkPacket } = dashboard.actions;
