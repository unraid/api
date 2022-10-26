import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import NodeCache from 'node-cache';

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
	},
});

export const { setCache } = cache.actions;
