import { MemoryCacheStatus } from '@app/store/types';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import merge from 'lodash/merge';
import { type Server } from '@app/graphql/generated/client/graphql';
import { logoutUser } from '@app/store/modules/config';
import { queryServers } from '@app/store/actions/query-servers';
import { logger } from '@app/core/log';

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
	},
	extraReducers(builder) {
		builder.addCase(logoutUser.pending, state => {
			state.servers = [];
		});
		builder.addCase(queryServers.fulfilled, (state, action) => {
			logger.debug('Got servers for user:', action.payload.map(server => server.name).join(','));
			state.servers = action.payload;
			state.status = MemoryCacheStatus.CACHED;
		});
	},
});

export const { cacheServers, clearAllServers } = servers.actions;
