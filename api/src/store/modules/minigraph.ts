import { minigraphLogger } from '@app/core/log';
import { createAsyncThunk, createSlice, EnhancedStore, PayloadAction } from '@reduxjs/toolkit';
import { Client } from 'graphql-ws';
import { RootState, store } from '@app/store';
import { createMinigraphClient } from '@app/mothership/minigraph-client';

export enum MinigraphStatus {
	'CONNECTING',
	'CONNECTED',
	'ERROR',
	'DISCONNECTED',
	'RETRY_WAITING',
}

export enum SubscriptionKey {
	'SERVERS',
}

interface MinigraphClientSubscription {
	subscription: () => void;
	subscriptionId: string;
	subscriptionKey: SubscriptionKey;
}

interface MinigraphClientState {
	status: MinigraphStatus;
	error: null | { message: string };
	subscriptions: MinigraphClientSubscription[];
	client: Client | null;
}

const initialState: MinigraphClientState = {
	status: MinigraphStatus.DISCONNECTED,
	error: null,
	subscriptions: [],
	client: null,
};

const createNewClient = createAsyncThunk<Client, void, { state: RootState }>(
	'minigraph/createNewClient',
	async (_, { getState }) => {
		const { minigraph } = getState();
		if (minigraph.client) await minigraph.client.dispose();
		return createMinigraphClient();
	},
);

export const minigraph = createSlice({
	name: 'minigraph',
	initialState,
	reducers: {
		setStatus(state, action: PayloadAction<Pick<MinigraphClientState, 'status' | 'error'>>) {
			state.status = action.payload.status;
			state.error = action.payload.error;

			if (action.payload.status === MinigraphStatus.DISCONNECTED) {
				state.subscriptions = [];
			}
		},
		setClient(state, action: PayloadAction<Client>) {
			state.client = action.payload;
		},
		addSubscription(state, action: PayloadAction<MinigraphClientSubscription>) {
			state.subscriptions.push(action.payload);
		},
		removeSubscriptionById(state, action: PayloadAction<string>) {
			const newSubscriptions = state.subscriptions
				.filter(subscriptions => subscriptions.subscriptionId !== action.payload);
			if (newSubscriptions.length === state.subscriptions.length) {
				minigraphLogger.error('Failed to remove subscription with ID: %s', action.payload);
			}

			state.subscriptions = newSubscriptions;
		},
	},
	extraReducers(builder) {
		builder.addCase(createNewClient.fulfilled, (state, action) => {
			if (action.payload) {
				// Client was destroyed and existed
			} else {
				minigraphLogger.warn('Minigraph Client was not destroyed because it did not exist');
			}

			state.status = MinigraphStatus.DISCONNECTED;
			state.subscriptions = [];
			state.error = null;
			state.client = action.payload;
		});
		builder.addCase(createNewClient.rejected, state => {
			state.status = MinigraphStatus.ERROR;
			state.error = new Error('Failed to destroy minigraph client');
		});
	},
});

export const { setStatus, setClient, addSubscription, removeSubscriptionById } = minigraph.actions;

export const getNewMinigraphClient = async (appStore?: typeof store | EnhancedStore<{ minigraph: MinigraphClientState }>) => {
	const store = (appStore ?? await import('@app/store/index').then(_ => _.store));
	return store?.dispatch(createNewClient()).unwrap();
};

export const isKeySubscribed = async (subscriptionKey: SubscriptionKey, appStore?: typeof store | EnhancedStore<{ minigraph: MinigraphClientState }>) => {
	const store = (appStore ?? await import('@app/store/index').then(_ => _.store));
	return store?.getState().minigraph.subscriptions.some(subscription => subscription.subscriptionKey === subscriptionKey);
};
