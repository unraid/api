import { join } from 'path';

import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { merge } from 'lodash-es';

import type { RootState } from '@app/store/index.js';
import type { StateFileToIniParserMap } from '@app/store/types.js';
import { emhttpLogger } from '@app/core/log.js';
import { type Devices } from '@app/core/types/states/devices.js';
import { type Networks } from '@app/core/types/states/network.js';
import { type NfsShares } from '@app/core/types/states/nfs.js';
import { type Nginx } from '@app/core/types/states/nginx.js';
import { type Shares } from '@app/core/types/states/share.js';
import { type SmbShares } from '@app/core/types/states/smb.js';
import { type Users } from '@app/core/types/states/user.js';
import { type Var } from '@app/core/types/states/var.js';
import { parseConfig } from '@app/core/utils/misc/parse-config.js';
import { FileLoadStatus, StateFileKey } from '@app/store/types.js';
import { ArrayDisk } from '@app/unraid-api/graph/resolvers/array/array.model.js';

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

export const parsers: {
    [K in StateFileKey]: () => Promise<StateFileToIniParserMap[K]>;
} = {
    [StateFileKey.var]: async () => (await import('@app/store/state-parsers/var.js')).parse,
    [StateFileKey.devs]: async () => (await import('@app/store/state-parsers/devices.js')).parse,
    [StateFileKey.network]: async () => (await import('@app/store/state-parsers/network.js')).parse,
    [StateFileKey.nginx]: async () => (await import('@app/store/state-parsers/nginx.js')).parse,
    [StateFileKey.shares]: async () => (await import('@app/store/state-parsers/shares.js')).parse,
    [StateFileKey.disks]: async () => (await import('@app/store/state-parsers/slots.js')).parse,
    [StateFileKey.users]: async () => (await import('@app/store/state-parsers/users.js')).parse,
    [StateFileKey.sec]: async () => (await import('@app/store/state-parsers/smb.js')).parse,
    [StateFileKey.sec_nfs]: async () => (await import('@app/store/state-parsers/nfs.js')).parse,
};

const getParserFunction = async (parser: StateFileKey): Promise<StateFileToIniParserMap[StateFileKey]> =>
    await parsers[parser]();

const parseState = async <T extends StateFileKey, Q = ReturnType<StateFileToIniParserMap[T]> | null>(
    statesDirectory: string,
    parser: T,
    defaultValue?: NonNullable<Q>
): Promise<Q> => {
    const filePath = join(statesDirectory, `${parser}.ini`);

    try {
        emhttpLogger.trace('Loading state file from "%s"', filePath);
        const config = parseConfig<Parameters<StateFileToIniParserMap[T]>[0]>({
            filePath,
            type: 'ini',
        });
        const parserFn = await getParserFunction(parser);
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
export const loadSingleStateFile = createAsyncThunk<any, StateFileKey, { state: RootState }>(
    'emhttp/load-single-state-file',
    async (stateFileKey, { getState }) => {
        const path = getState().paths.states;

        const config = await parseState(path, stateFileKey);
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
    }
);
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
        var: await parseState(path, StateFileKey.var, {} as Var),
        devices: await parseState(path, StateFileKey.devs, []),
        networks: await parseState(path, StateFileKey.network, []),
        nginx: await parseState(path, StateFileKey.nginx, {} as Nginx),
        shares: await parseState(path, StateFileKey.shares, []),
        disks: await parseState(path, StateFileKey.disks, []),
        users: await parseState(path, StateFileKey.users, []),
        smbShares: await parseState(path, StateFileKey.sec, []),
        nfsShares: await parseState(path, StateFileKey.sec_nfs, []),
    };

    return state;
});

export const emhttp = createSlice({
    name: 'emhttp',
    initialState,
    reducers: {
        updateEmhttpState(
            state,
            action: PayloadAction<{
                field: StateFileKey;
                state: Partial<(typeof initialState)[keyof typeof initialState]>;
            }>
        ) {
            const { field } = action.payload;
            return merge(state, { [field]: action.payload.state });
        },
    },
    extraReducers(builder) {
        builder.addCase(loadStateFiles.pending, (state) => {
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
                // const changedKey = Object.keys(action.payload)[0]
                // emhttpLogger.debug('Key', changedKey, 'Difference in changes', getDiff(action.payload, { [changedKey]: state[changedKey] } ))
                merge(state, action.payload);
            } else {
                emhttpLogger.warn('Invalid payload returned from loadSingleStateFile()');
            }
        });
    },
});

export const { updateEmhttpState } = emhttp.actions;
