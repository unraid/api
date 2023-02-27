import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { logoutUser } from '@app/store/modules/config';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { minigraphLogger } from '@app/core/log';

export type MinigraphClientState = {
	status: MinigraphStatus;
	error: string | null;
	timeout: number | null;
	timeoutStart: number | null;
	isSubscribedToEvents: boolean;
};

const initialState: MinigraphClientState = {
	status: MinigraphStatus.DISCONNECTED,
	error: null,
	timeout: null,
	timeoutStart: null,
	isSubscribedToEvents: false,
};

export const mothership = createSlice({
	name: 'mothership',
	initialState,
	reducers: {
		setSubscribedToEvents(state, action: PayloadAction<boolean>) {
			state.isSubscribedToEvents = action.payload;
		},
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
			if ([MinigraphStatus.DISCONNECTED].includes(action.payload.status)) {
				state.isSubscribedToEvents = false;
				GraphQLClient.clearInstance();
			} else if ([MinigraphStatus.CONNECTED, MinigraphStatus.CONNECTING].includes(action.payload.status)) {
				state.error = null;
				state.timeout = null;
				state.timeoutStart = null;
			}
		});
		builder.addCase(logoutUser.pending, state => {
			GraphQLClient.clearInstance();
			state.isSubscribedToEvents = false;
			state.error = null;
			state.timeout = null;
			state.timeoutStart = null;
			state.status = MinigraphStatus.DISCONNECTED;
		});
	},
});

export const { setSubscribedToEvents, setMothershipTimeout } = mothership.actions;
