import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { logoutUser } from '@app/store/modules/config';
import { type PayloadAction, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { MOTHERSHIP_CRITICAL_STATUSES, type SubscriptionWithTimeout } from '@app/store/types';
import { remoteAccessLogger } from '@app/core/log';
import { addRemoteSubscription } from '@app/store/actions/add-remote-subscription';

interface RemoteGraphQLStore {
    subscriptions: Array<SubscriptionWithTimeout>
}

const initialState: RemoteGraphQLStore = {
    subscriptions: []
};

const remoteGraphQLStore = createSlice({
    name: 'remoteGraphQL',
    initialState,
    reducers: {
        clearSubscription(state, action: PayloadAction<string>) {
            remoteAccessLogger.debug('Clearing subscription with SHA %s', action.payload)
            const subscription = state.subscriptions.find(sub => sub.sha256 === action.payload);
            if (subscription) {
                clearTimeout(subscription.timeout);
                subscription.subscription.unsubscribe();
                state.subscriptions = state.subscriptions.filter(subscription => subscription.sha256 !== action.payload);
            }

            remoteAccessLogger.debug('Current remote subscriptions: %s', state.subscriptions.length);
        },
        renewRemoteSubscription(
            state,
            { payload: { sha256, timeout }}: PayloadAction<{ sha256: string; timeout: NodeJS.Timeout }>
        ) {
            const subscription = state.subscriptions.find(sub => sub.sha256 === sha256);
            if (subscription) {
                remoteAccessLogger.debug('Clearing timeout for sha %s', sha256);
                clearTimeout(subscription.timeout);
                subscription.timeout = timeout;
            }
        },
    },
    extraReducers(builder) {
        
        builder.addCase(addRemoteSubscription.rejected, (_, action) => {
            if (action.error) {
                remoteAccessLogger.warn('Handling Add Remote Sub Error: %s', action.error.message)
            }
        })
        builder.addCase(addRemoteSubscription.fulfilled, (state, action) => {
            remoteAccessLogger.info('Successfully added new remote subscription');
            state.subscriptions.push(action.payload);
        }),
        builder.addMatcher(
            isAnyOf(logoutUser.pending, setGraphqlConnectionStatus),
            (state, action) => {
                if (
                    (action.payload?.status &&
                        MOTHERSHIP_CRITICAL_STATUSES.includes(
                            action.payload.status
                        )) ||
                    action.type === logoutUser.pending.type
                ) {
                    remoteAccessLogger.debug(
                        'Clearing all active remote subscriptions, minigraph is no longer connected.'
                    );
                    for (const sub of state.subscriptions) {
                        clearTimeout(sub.timeout);
                        sub.subscription.unsubscribe();
                    }
                    state.subscriptions = [];
                }
            }
        )
    },
});



export const {
    clearSubscription,
    renewRemoteSubscription,
} = remoteGraphQLStore.actions;
export const remoteGraphQLReducer = remoteGraphQLStore.reducer;
