/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { FileLoadStatus, StateFileKey, type StateFileToIniParserMap } from '@app/store/types';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import merge from 'lodash/merge';
import { join } from 'path';
import { emhttpLogger, logger } from '@app/core/log';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { type Devices } from '@app/core/types/states/devices';
import { type Networks } from '@app/core/types/states/network';
import { type Nginx } from '@app/core/types/states/nginx';
import { type Shares } from '@app/core/types/states/share';
import { type Users } from '@app/core/types/states/user';
import { type NfsShares } from '@app/core/types/states/nfs';
import { type SmbShares } from '@app/core/types/states/smb';
import { type Var } from '@app/core/types/states/var';
import { parse as parseDevices } from '@app/store/state-parsers/devices';
import { parse as parseNetwork } from '@app/store/state-parsers/network';
import { parse as parseNginx } from '@app/store/state-parsers/nginx';
import { parse as parseNfsShares } from '@app/store/state-parsers/nfs';
import { parse as parseShares } from '@app/store/state-parsers/shares';
import { parse as parseSlots } from '@app/store/state-parsers/slots';
import { parse as parseSmbShares } from '@app/store/state-parsers/smb';
import { parse as parseUsers } from '@app/store/state-parsers/users';
import { parse as parseVar } from '@app/store/state-parsers/var';
import type { RootState } from '@app/store';
import { type ArrayDisk } from '@app/graphql/generated/api/types';

export type SliceState = {
    status: FileLoadStatus;
    var: Var;
    devices: Devices;
    networks: Networks;
    nginx: Nginx;
    shares: Shares;
    disks: ArrayDisk[];
    users: Users;
    smbShares: SmbShares;
    nfsShares: NfsShares;
};

const initialState: SliceState = {
    status: FileLoadStatus.UNLOADED,
    var: {} as unknown as Var,
    devices: [],
    networks: [],
    nginx: {} as unknown as Nginx,
    shares: [],
    disks: [],
    users: [],
    smbShares: [],
    nfsShares: [],
};

export const parsers: StateFileToIniParserMap = {
    [StateFileKey.var]: parseVar,
    [StateFileKey.devs]: parseDevices,
    [StateFileKey.network]: parseNetwork,
    [StateFileKey.nginx]: parseNginx,
    [StateFileKey.shares]: parseShares,
    [StateFileKey.disks]: parseSlots,
    [StateFileKey.users]: parseUsers,
    [StateFileKey.sec]: parseSmbShares,
    [StateFileKey.sec_nfs]: parseNfsShares,
};

const getParserFunction = (
    parser: StateFileKey
): StateFileToIniParserMap[StateFileKey] => parsers[parser];

const parseState = <
    T extends StateFileKey,
    Q = ReturnType<StateFileToIniParserMap[T]> | null
>(
    statesDirectory: string,
    parser: T,
    defaultValue?: NonNullable<Q>
): Q => {
    const filePath = join(statesDirectory, `${parser}.ini`);

    try {
        emhttpLogger.trace('Loading state file from "%s"', filePath);
        const config = parseConfig<Parameters<StateFileToIniParserMap[T]>[0]>({
            filePath,
            type: 'ini',
        });
        const parserFn = getParserFunction(parser);
        // @TODO Not sure why this type doesn't work
        return parserFn(config as unknown as any) as Q;
    } catch (error: unknown) {
        emhttpLogger.error(
            'Failed loading state file from "%s" with "%s"',
            filePath,
            error instanceof Error ? error.message : String(error)
        );
    }

    if (defaultValue) {
        return defaultValue as Q;
    }

    return null as Q;
};

// @TODO Fix the type here Pick<SliceState, 'var' | 'devices' | 'networks' | 'nginx' | 'shares' | 'disks' | 'users' | 'smbShares' | 'nfsShares'> | null
export const loadSingleStateFile = createAsyncThunk<
    any,
    StateFileKey,
    { state: RootState }
>('emhttp/load-single-state-file', async (stateFileKey, { getState }) => {
    const path = getState().paths.states;

    const config = parseState(path, stateFileKey);
    if (config) {
        switch (stateFileKey) {
            case StateFileKey.var:
                return { var: config };
            case StateFileKey.devs:
                return { devices: config };
            case StateFileKey.network:
                return { networks: config };
            case StateFileKey.nginx:
                return { nginx: config };
            case StateFileKey.shares:
                return { shares: config };
            case StateFileKey.disks:
                return { disks: config };
            case StateFileKey.users:
                return { users: config };
            case StateFileKey.sec:
                return { smbShares: config };
            case StateFileKey.sec_nfs:
                return { nfsShares: config };
            default:
                return null;
        }
    } else {
        return null;
    }
});
/**
 * Load the emhttp states into the store.
 */
export const loadStateFiles = createAsyncThunk<
    Omit<SliceState, 'mode' | 'status'>,
    void,
    { state: RootState }
>('emhttp/load-state-file', async (_, { getState }) => {
    const path = getState().paths.states;
    const state: Omit<SliceState, 'mode' | 'status'> = {
        var: parseState(path, StateFileKey.var, {} as Var),
        devices: parseState(path, StateFileKey.devs, []),
        networks: parseState(path, StateFileKey.network, []),
        nginx: parseState(path, StateFileKey.nginx, {} as Nginx),
        shares: parseState(path, StateFileKey.shares, []),
        disks: parseState(path, StateFileKey.disks, []),
        users: parseState(path, StateFileKey.users, []),
        smbShares: parseState(path, StateFileKey.sec, []),
        nfsShares: parseState(path, StateFileKey.sec_nfs, []),
    };

    return state;
});

export const emhttp = createSlice({
	name: 'emhttp',
	initialState,
	reducers: {
		updateEmhttpState(state, action: PayloadAction<{ field: StateFileKey; state: Partial<typeof initialState[keyof typeof initialState]> }>) {
			const { field } = action.payload;
			return merge(state, { [field]: action.payload.state });
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

		builder.addCase(loadSingleStateFile.fulfilled, (state, action) => {
			if (action.payload) {
				merge(state, action.payload);
			} else {
				emhttpLogger.warn('Invalid payload returned from loadSingleStateFile()');
			}
		});
	},
});

export const { updateEmhttpState } = emhttp.actions;
