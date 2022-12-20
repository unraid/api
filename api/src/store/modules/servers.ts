import { MemoryCacheStatus } from '@app/store/types';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import merge from 'lodash/merge';
import { type Server } from '../../graphql/generated/client/graphql';

type SliceState = {
	status: MemoryCacheStatus;
	servers: Server[];
};

const initialState: SliceState = {
	status: MemoryCacheStatus.UNCACHED,
	servers: [],
};

export const servers = createSlice({
	name: 'servers',
	initialState,
	reducers: {
		cacheServers(state, action: PayloadAction<Server[]>) {
			state.servers = action.payload;
		},
		clearAllServers(state) {
			state.servers = [];
		},
		updateServersState(state, action: PayloadAction<Partial<typeof initialState>>) {
			return merge(state, action.payload);
		},
	},
});

export const { cacheServers, clearAllServers, updateServersState } = servers.actions;
