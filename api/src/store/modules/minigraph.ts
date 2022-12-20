import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';

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
	subscriptions: Record<SubscriptionKey, boolean>;
};

const initialState: MinigraphClientState = {
	status: MinigraphStatus.DISCONNECTED,
	error: null,
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
	},
	extraReducers(builder) {
		builder.addCase(setGraphqlConnectionStatus, (state, action) => {
			state.status = action.payload.status;
			state.error = action.payload.error;
		});
	},
});

export const { addSubscription, removeSubscription } = mothership.actions;
