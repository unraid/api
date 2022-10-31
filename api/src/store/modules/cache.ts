import NodeCache from 'node-cache';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CacheKeys, type DNSCheck } from '@app/store/types';
import type { Cloud } from '@app/graphql/resolvers/query/cloud/create-response';

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
		setCloudCheck(state, action: PayloadAction<Cloud['cloud']>) {
			const ttl = action.payload.error === null ? 60 * 60 * 4 : 60 * 5; // 4 hours for a success,  5 minutes for a failure
			state.nodeCache.set(CacheKeys.checkCloud, action.payload, ttl);
		},
		setDNSCheck(state, action: PayloadAction<DNSCheck>) {
			const ttl = action.payload.error === null ? 60 * 60 * 12 : 60 * 5; // 12 hours for a success, 5 minutes for a failure
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
