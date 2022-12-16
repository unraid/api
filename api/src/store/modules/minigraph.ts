import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { MinigraphStatus } from '@app/graphql/generated/api/types';

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
		setStatus(state, action: PayloadAction<Pick<MinigraphClientState, 'status' | 'error'>>) {
			state.status = action.payload.status;
			state.error = action.payload.error;

			if (action.payload.status === MinigraphStatus.DISCONNECTED) {
				state.subscriptions = initialState.subscriptions;
			}
		},
		addSubscription(state, action: PayloadAction<SubscriptionKey>) {
			state.subscriptions[action.payload] = true;
		},
		removeSubscription(state, action: PayloadAction<SubscriptionKey>) {
			state.subscriptions[action.payload] = false;
		},
	},
});

export const { setStatus, addSubscription, removeSubscription } = mothership.actions;
