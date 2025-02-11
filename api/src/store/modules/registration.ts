import { format } from 'util';

import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { merge } from 'lodash-es';

import type { RootState } from '@app/store';
import { logger } from '@app/core/log';
import { getKeyFile } from '@app/core/utils/misc/get-key-file';
import { FileLoadStatus } from '@app/store/types';

export type SliceState = {
    status: FileLoadStatus;
    keyFile: string | null;
};

const initialState = {
    status: FileLoadStatus.UNLOADED,
    keyFile: null,
};

export const loadRegistrationKey = createAsyncThunk<
    { keyFile: string | null },
    void,
    { state: RootState }
>('registration/load-registration-key', async (_, { getState }) => {
    try {
        logger.trace('Loading registration key file');

        return {
            keyFile: await getKeyFile(getState()),
        };
    } catch (error: unknown) {
        if (!(error instanceof Error))
            throw new Error(
                format('Failed loading registration key with unknown error "%s"', String(error))
            );
        logger.error('Failed loading registration key with "%s"', error.message);
    }

    return {
        keyFile: null,
    };
});

export const registration = createSlice({
    name: 'registration',
    initialState,
    reducers: {
        updateRegistrationState(state, action: PayloadAction<Partial<{ keyFile: string }>>) {
            return merge(state, action.payload);
        },
    },
    extraReducers(builder) {
        builder.addCase(loadRegistrationKey.pending, (state) => {
            state.status = FileLoadStatus.LOADING;
        });

        builder.addCase(loadRegistrationKey.fulfilled, (state, action) => {
            merge(state, action.payload, { status: FileLoadStatus.LOADED });
        });

        builder.addCase(loadRegistrationKey.rejected, (state, action) => {
            merge(state, action.payload, { status: FileLoadStatus.FAILED_LOADING });
        });
    },
});
