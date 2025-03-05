import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import NodeCache from 'node-cache';

import type { DNSCheck } from '@app/store/types.js';
import { ONE_HOUR_SECS } from '@app/consts.js';
import { type CloudResponse } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { CacheKeys } from '@app/store/types.js';

const initialState: {
    nodeCache: NodeCache;
} = {
    nodeCache: new NodeCache(),
};

export const cache = createSlice({
    name: 'cache',
    initialState,
    reducers: {
        setCache(state, action: PayloadAction<{ key: string; value: unknown; ttl: number }>) {
            state.nodeCache.set(action.payload.key, action.payload.value, action.payload.ttl);
        },
        setCloudCheck(state, action: PayloadAction<CloudResponse>) {
            const ttl = action.payload.error === null ? ONE_HOUR_SECS * 4 : 60 * 5; // 4 hours for a success,  5 minutes for a failure
            state.nodeCache.set(CacheKeys.checkCloud, action.payload, ttl);
        },
        setDNSCheck(state, action: PayloadAction<DNSCheck>) {
            // Cache permanently if we set this option
            const customTTL = !action.payload.error && action.payload.ttl ? action.payload.ttl : null;

            const ttl = (customTTL ?? action.payload.error === null) ? ONE_HOUR_SECS * 12 : 60 * 15; // 12 hours for a success, 15 minutes for a failure
            state.nodeCache.set(CacheKeys.checkDns, action.payload, ttl);
        },
        clearKey(state, action: PayloadAction<CacheKeys>) {
            state.nodeCache.del(action.payload);
        },
        flushCache(state) {
            state.nodeCache.flushAll();
        },
    },
});

export const { setCache, setCloudCheck, setDNSCheck, clearKey, flushCache } = cache.actions;
