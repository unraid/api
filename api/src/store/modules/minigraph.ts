import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { loginUser, logoutUser } from '@app/store/modules/config';
import { minigraphLogger } from '@app/core/log';

export type MinigraphClientState = {
	status: MinigraphStatus;
	error: string | null;
	timeout: number | null;
	timeoutStart: number | null;
};

const initialState: MinigraphClientState = {
	status: MinigraphStatus.DISCONNECTED,
	error: null,
	timeout: null,
	timeoutStart: null,
};

export const mothership = createSlice({
	name: 'mothership',
	initialState,
	reducers: {
		setMothershipTimeout(state, action: PayloadAction<number>) {
			state.timeout = action.payload;
			state.timeoutStart = Date.now();
		},
	},
	extraReducers(builder) {
		builder.addCase(setGraphqlConnectionStatus, (state, action) => {
			minigraphLogger.debug('GraphQL Connection Status: ', action.payload);
			state.status = action.payload.status;
			state.error = action.payload.error;
			if ([MinigraphStatus.CONNECTED, MinigraphStatus.CONNECTING].includes(action.payload.status)) {
				state.error = null;
				state.timeout = null;
				state.timeoutStart = null;
			}
		});
		builder.addCase(loginUser.pending, state => {
			state.timeout = null;
			state.timeoutStart = null;
			state.status = MinigraphStatus.DISCONNECTED;
			state.error = 'Connecting - refresh the page for an updated status.';
		});
		builder.addCase(logoutUser.pending, state => {
			// GraphQLClient.clearInstance();
			state.error = null;
			state.timeout = null;
			state.timeoutStart = null;
			state.status = MinigraphStatus.DISCONNECTED;
		});
	},
});

export const { setMothershipTimeout } = mothership.actions;
