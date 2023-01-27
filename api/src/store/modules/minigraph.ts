import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { logoutUser } from '@app/store/modules/config';
import { GraphQLClient } from '@app/mothership/graphql-client';

export enum SubscriptionKey {
	SERVERS = 'SERVERS',
	EVENTS = 'EVENTS',
}

export type GraphqlClientSubscription = {
	subscriptionKey: SubscriptionKey;
};

export type MinigraphClientState = {
	status: MinigraphStatus;
	error: string | null;
	timeout: number | null;
	timeoutStart: number | null;
	subscriptions: Record<SubscriptionKey, boolean>;
};

const initialState: MinigraphClientState = {
	status: MinigraphStatus.DISCONNECTED,
	error: null,
	timeout: null,
	subscriptions: {
		[SubscriptionKey.EVENTS]: false,
		[SubscriptionKey.SERVERS]: false,
	},
};

export const mothership = createSlice({
	name: 'mothership',
	initialState,
	reducers: {
		addSubscription(state, action: PayloadAction<SubscriptionKey>) {
			state.subscriptions[action.payload] = true;
		},
		removeSubscription(state, action: PayloadAction<SubscriptionKey>) {
			state.subscriptions[action.payload] = false;
		},
		setMothershipTimeout(state, action: PayloadAction<number>) {
			state.timeout = action.payload;
			state.timeoutStart = Date.now();
		}
	},
	extraReducers(builder) {
		builder.addCase(setGraphqlConnectionStatus, (state, action) => {
			state.status = action.payload.status;
			state.error = action.payload.error;
			if ([MinigraphStatus.DISCONNECTED].includes(action.payload.status)) {
				state.subscriptions.EVENTS = false;
				state.subscriptions.SERVERS = false;
			} else if ([MinigraphStatus.CONNECTED, MinigraphStatus.CONNECTING].includes(action.payload.status)) {
				state.error = null;
				state.timeout = null;
			}
		});
		builder.addCase(logoutUser.pending, state => {
			GraphQLClient.clearInstance();
			state.subscriptions.EVENTS = false;
			state.subscriptions.SERVERS = false;
			state.error = null;
			state.timeout = null;
			state.status = MinigraphStatus.DISCONNECTED;
		});
	},
});

export const { addSubscription, removeSubscription, setMothershipTimeout } = mothership.actions;
