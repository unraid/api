/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { FileLoadStatus } from '@app/store/types';
import { createAsyncThunk, createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import merge from 'lodash.merge';
import { join } from 'path';
import { logger } from '@app/core';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { Devices } from '@app/core/types/states/devices';
import { Networks } from '@app/core/types/states/network';
import { Shares } from '@app/core/types/states/share';
import { Users } from '@app/core/types/states/user';
import { NfsShares } from '@app/core/types/states/nfs';
import { Slots } from '@app/core/types/states/slots';
import { SmbShares } from '@app/core/types/states/smb';
import { Var } from '@app/core/types/states/var';
import { parse as parseDevices } from '@app/store/state-parsers/devices';
import { parse as parseNetwork } from '@app/store/state-parsers/network';
import { parse as parseNfsShares } from '@app/store/state-parsers/nfs';
import { parse as parseShares } from '@app/store/state-parsers/shares';
import { parse as parseSlots } from '@app/store/state-parsers/slots';
import { parse as parseSmbShares } from '@app/store/state-parsers/smb';
import { parse as parseUsers } from '@app/store/state-parsers/users';
import { parse as parseVar } from '@app/store/state-parsers/var';

export type SliceState = {
	status: FileLoadStatus;
	var: Var;
	devices: Devices;
	networks: Networks;
	shares: Shares;
	slots: Slots;
	users: Users;
	smbShares: SmbShares;
	nfsShares: NfsShares;
};

const initialState: SliceState = {
	status: FileLoadStatus.UNLOADED,
	var: {} as unknown as Var,
	devices: [] as Devices,
	networks: [] as Networks,
	shares: [] as Shares,
	slots: [] as Slots,
	users: [] as Users,
	smbShares: [] as SmbShares,
	nfsShares: [] as NfsShares,
};

export const parsers = {
	var: parseVar,
	devs: parseDevices,
	network: parseNetwork,
	shares: parseShares,
	disks: parseSlots,
	users: parseUsers,
	sec: parseSmbShares,
	sec_nfs: parseNfsShares,
};

const parseState = <Parser extends keyof typeof parsers, DefaultValue = ReturnType<typeof parsers[Parser]>>(statesDirectory: string, parser: Parser, defaultValue: DefaultValue): DefaultValue => {
	const filePath = join(statesDirectory, `${parser}.ini`);

	try {
		logger.trace('Loading state file from "%s"', filePath);
		return parsers[parser](parseConfig({
			filePath,
			type: 'ini',
		})) as DefaultValue;
	} catch (error: unknown) {
		logger.error('Failed loading state file from "%s" with error', filePath);
		logger.error(error);
	}

	return defaultValue;
};

/**
 * Load the emhttp states into the store.
 */
export const loadStateFiles = createAsyncThunk<SliceState, string | undefined>('states/load-state-file', async statesDirectory => {
	const store = await import('@app/store');
	const paths = store.getters.paths();
	const path = statesDirectory ?? paths.states;
	const state: SliceState = {
		status: FileLoadStatus.LOADED,
		var: parseState(path, 'var', {} as Var),
		devices: parseState(path, 'devs', []),
		networks: parseState(path, 'network', []),
		shares: parseState(path, 'shares', []),
		slots: parseState(path, 'disks', []),
		users: parseState(path, 'users', []),
		smbShares: parseState(path, 'sec', []),
		nfsShares: parseState(path, 'sec_nfs', []),
	};

	return state;
});

export const emhttp = createSlice({
	name: 'emhttp',
	initialState,
	reducers: {
		updateEmhttpState(state, action: PayloadAction<{ field: keyof typeof parsers; state: Partial<typeof initialState[keyof typeof initialState]> }>) {
			return merge(state, action.payload) as SliceState;
		},
	},
	extraReducers(builder) {
		builder.addCase(loadStateFiles.pending, (state, _action) => {
			state.status = FileLoadStatus.LOADING;
		});

		builder.addCase(loadStateFiles.fulfilled, (state, action) => {
			merge(state, action.payload, { status: FileLoadStatus.LOADED });
		});

		builder.addCase(loadStateFiles.rejected, (state, action) => {
			merge(state, action.payload, { status: FileLoadStatus.FAILED_LOADING });
		});
	},
});

export const { updateEmhttpState } = emhttp.actions;
