import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { loginUser, logoutUser } from '@app/store/modules/config';
import { minigraphLogger } from '@app/core/log';
import { KEEP_ALIVE_INTERVAL_MS } from '@app/consts';

export type MinigraphClientState = {
    status: MinigraphStatus;
    error: string | null;
    lastPing: number | null;
    selfDisconnectedSince: number | null;
    timeout: number | null;
    timeoutStart: number | null;
};

const initialState: MinigraphClientState = {
    status: MinigraphStatus.PRE_INIT,
    error: null,
    lastPing: null,
    selfDisconnectedSince: null,
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
        receivedMothershipPing(state) {
            state.lastPing = Date.now();
        },
        setSelfDisconnected(state) {
            minigraphLogger.error(
                `Received disconnect event for own server, waiting for ${
                    KEEP_ALIVE_INTERVAL_MS / 1_000
                } seconds before setting disconnected`
            );
            state.selfDisconnectedSince = Date.now();
        },
        setSelfReconnected(state) {
            minigraphLogger.error(
                'Received connected event for own server, clearing disconnection timeout'
            );
            state.selfDisconnectedSince = null;
        },
    },
    extraReducers(builder) {
        builder.addCase(setGraphqlConnectionStatus, (state, action) => {
            minigraphLogger.debug(
                'GraphQL Connection Status: ',
                action.payload
            );
            state.status = action.payload.status;
            state.error = action.payload.error;
            if (
                [
                    MinigraphStatus.CONNECTED,
                    MinigraphStatus.CONNECTING,
                ].includes(action.payload.status)
            ) {
                state.error = null;
                state.timeout = null;
                state.lastPing = null;
                state.selfDisconnectedSince = null;
                state.timeoutStart = null;
            }
        });
        builder.addCase(loginUser.pending, (state) => {
            state.timeout = null;
            state.timeoutStart = null;
            state.lastPing = null;
            state.selfDisconnectedSince = null;
            state.status = MinigraphStatus.PRE_INIT;
            state.error =
                'Connecting - refresh the page for an updated status.';
        });
        builder.addCase(logoutUser.pending, (state) => {
            // GraphQLClient.clearInstance();
            state.error = null;
            state.timeout = null;
            state.lastPing = null;
            state.selfDisconnectedSince = null;
            state.timeoutStart = null;
            state.status = MinigraphStatus.PRE_INIT;
        });
    },
});

export const {
    setMothershipTimeout,
    receivedMothershipPing,
    setSelfDisconnected,
    setSelfReconnected,
} = mothership.actions;
