import NodeCache from 'node-cache';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CacheKeys } from '@app/types/cache-keys';
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
			const ttl = action.payload.error === null ? 60 * 30 : 60 * 2; // 30 minutes for a success,  2 minutes for a failure
			state.nodeCache.set(CacheKeys.checkCloud, action.payload, ttl);
		},
	},
});

export const { setCache } = cache.actions;
