import { MemoryCacheStatus } from '@app/store/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import merge from 'lodash/merge';

type Url = string;
type IpAddress = string;
type Status = 'online' | 'offline';

export interface Owner {
	username: string;
	url: Url;
	avatar: Url;
}

export type Server = {
	owner: Owner;
	guid: string;
	apikey: string;
	name: string;
	status: Status;
	wanip: IpAddress | null;
	lanip: IpAddress;
	localurl: Url;
	remoteurl: string | null;
};

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
