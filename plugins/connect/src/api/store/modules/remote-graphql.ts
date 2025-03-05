import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, isAnyOf } from '@reduxjs/toolkit';

import type { SubscriptionWithLastPing } from '@app/store/types.js';
import { remoteAccessLogger } from '@app/core/log.js';
import { addRemoteSubscription } from '@app/store/actions/add-remote-subscription.js';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status.js';
import { logoutUser } from '@app/store/modules/config.js';
import { MOTHERSHIP_CRITICAL_STATUSES } from '@app/store/types.js';

export interface RemoteGraphQLStore {
    subscriptions: Array<SubscriptionWithLastPing>;
}

const initialState: RemoteGraphQLStore = {
    subscriptions: [],
};

const remoteGraphQLStore = createSlice({
    name: 'remoteGraphQL',
    initialState,
    reducers: {
        clearSubscription(state, action: PayloadAction<string>) {
            remoteAccessLogger.debug('Clearing subscription with SHA %s', action.payload);
            const subscription = state.subscriptions.find((sub) => sub.sha256 === action.payload);
            if (subscription) {
                subscription.subscription.unsubscribe();
                state.subscriptions = state.subscriptions.filter(
                    (subscription) => subscription.sha256 !== action.payload
                );
            }

            remoteAccessLogger.debug('Current remote subscriptions: %s', state.subscriptions.length);
        },
        renewRemoteSubscription(state, { payload: { sha256 } }: PayloadAction<{ sha256: string }>) {
            const subscription = state.subscriptions.find((sub) => sub.sha256 === sha256);
            if (subscription) {
                subscription.lastPing = Date.now();
            }
        },
    },
    extraReducers(builder) {
        builder.addCase(addRemoteSubscription.rejected, (_, action) => {
            if (action.error) {
                remoteAccessLogger.warn('Handling Add Remote Sub Error: %s', action.error.message);
            }
        });
        builder.addCase(addRemoteSubscription.fulfilled, (state, action) => {
            remoteAccessLogger.info('Successfully added new remote subscription');
            state.subscriptions.push({
                ...action.payload,
                lastPing: Date.now(),
            });
        }),
            builder.addMatcher(
                isAnyOf(logoutUser.pending, setGraphqlConnectionStatus),
                (state, action) => {
                    if (
                        (action.payload?.status &&
                            MOTHERSHIP_CRITICAL_STATUSES.includes(action.payload.status)) ||
                        action.type === logoutUser.pending.type
                    ) {
                        remoteAccessLogger.debug(
                            'Clearing all active remote subscriptions, minigraph is no longer connected.'
                        );
                        for (const sub of state.subscriptions) {
                            sub.subscription.unsubscribe();
                        }
                        state.subscriptions = [];
                    }
                }
            );
    },
});

export const { clearSubscription, renewRemoteSubscription } = remoteGraphQLStore.actions;
export const remoteGraphQLReducer = remoteGraphQLStore.reducer;
