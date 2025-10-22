import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { type DynamixConfig } from '@app/core/types/ini.js';
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
            return Object.assign(state, action.payload);
        },
    },
});

export const { updateDynamixConfig } = dynamix.actions;
