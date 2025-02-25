import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { merge } from 'lodash-es';

import { type DynamixConfig } from '@app/core/types/ini.js';
import { loadDynamixConfigFile } from '@app/store/actions/load-dynamix-config-file.js';
import { FileLoadStatus } from '@app/store/types.js';
import { RecursivePartial } from '@app/types/index.js';

export type SliceState = {
    status: FileLoadStatus;
} & DynamixConfig;

export const initialState: Partial<SliceState> = {
    status: FileLoadStatus.UNLOADED,
};

export const dynamix = createSlice({
    name: 'dynamix',
    initialState,
    reducers: {
        updateDynamixConfig(state, action: PayloadAction<RecursivePartial<SliceState>>) {
            return merge(state, action.payload);
        },
    },
    extraReducers(builder) {
        builder.addCase(loadDynamixConfigFile.pending, (state) => {
            state.status = FileLoadStatus.LOADING;
        });

        builder.addCase(loadDynamixConfigFile.fulfilled, (state, action) => {
            merge(state, action.payload, { status: FileLoadStatus.LOADED });
        });

        builder.addCase(loadDynamixConfigFile.rejected, (state, action) => {
            merge(state, action.payload, {
                status: FileLoadStatus.FAILED_LOADING,
            });
        });
    },
});

export const { updateDynamixConfig } = dynamix.actions;
