import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { remoteAccessLogger } from '@app/core/log.js';
import {
    AccessUrlInput,
    DynamicRemoteAccessType,
    URL_TYPE,
} from '@app/unraid-api/graph/resolvers/connect/connect.model.js';

interface DynamicRemoteAccessState {
    runningType: DynamicRemoteAccessType; // Is Dynamic Remote Access actively running - shows type of access currently running
    error: string | null;
    lastPing: number | null;
    allowedUrl: {
        ipv4: string | null | undefined;
        ipv6: string | null | undefined;
        type: URL_TYPE;
        name: string | null | undefined;
    } | null;
}

const initialState: DynamicRemoteAccessState = {
    runningType: DynamicRemoteAccessType.DISABLED,
    error: null,
    lastPing: null,
    allowedUrl: null,
};

const dynamicRemoteAccess = createSlice({
    name: 'dynamicRemoteAccess',
    initialState,
    reducers: {
        receivedPing(state) {
            remoteAccessLogger.info('ping');
            state.lastPing = Date.now();
        },
        clearPing(state) {
            remoteAccessLogger.info('clearing ping');
            state.lastPing = null;
        },
        setRemoteAccessRunningType(state, action: PayloadAction<DynamicRemoteAccessType>) {
            state.error = null;
            state.runningType = action.payload;
            if (action.payload === DynamicRemoteAccessType.DISABLED) {
                state.lastPing = null;
            } else {
                state.lastPing = Date.now();
            }
        },
        setDynamicRemoteAccessError(state, action: PayloadAction<string>) {
            state.error = action.payload;
        },
        setAllowedRemoteAccessUrl(state, action: PayloadAction<AccessUrlInput | null>) {
            if (action.payload) {
                state.allowedUrl = {
                    ipv4: action.payload.ipv4?.toString(),
                    ipv6: action.payload.ipv6?.toString(),
                    type: action.payload.type ?? URL_TYPE.WAN,
                    name: action.payload.name,
                };
            }
        },
    },
});

const { actions, reducer } = dynamicRemoteAccess;

export const {
    receivedPing,
    clearPing,
    setAllowedRemoteAccessUrl,
    setRemoteAccessRunningType,
    setDynamicRemoteAccessError,
} = actions;
export const dynamicRemoteAccessReducer = reducer;
