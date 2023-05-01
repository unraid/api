import { parseConfig } from '@app/core/utils/misc/parse-config';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { access } from 'fs/promises';
import merge from 'lodash/merge';
import { FileLoadStatus } from '@app/store/types';
import { F_OK } from 'constants';
import { type RecursivePartial, type RecursiveNullable } from '@app/types';
import { toBoolean } from '@app/core/utils/casting';
import { type DynamixConfig } from '@app/core/types/ini';

export type SliceState = {
    status: FileLoadStatus;
} & DynamixConfig;

export const initialState: Partial<SliceState> = {
    status: FileLoadStatus.UNLOADED,
};

/**
 * Load the dynamix.cfg into the store.
 *
 * Note: If the file doesn't exist this will fallback to default values.
 */
export const loadDynamixConfigFile = createAsyncThunk<
    RecursiveNullable<RecursivePartial<DynamixConfig>>,
    string | undefined
>('config/load-dynamix-config-file', async (filePath) => {
    const store = await import('@app/store');
    const paths = store.getters.paths();
    const path = filePath ?? paths['dynamix-config'];
    const fileExists = await access(path, F_OK)
        .then(() => true)
        .catch(() => false);
    const file = fileExists
        ? parseConfig<RecursivePartial<DynamixConfig>>({
              filePath: path,
              type: 'ini',
          })
        : {};
    const { display } = file;
    return merge(file, {
        ...(display?.scale ? { scale: toBoolean(display?.scale) } : {}),
        ...(display?.tabs ? { tabs: toBoolean(display?.tabs) } : {}),
        ...(display?.resize ? { resize: toBoolean(display?.resize) } : {}),
        ...(display?.wwn ? { wwn: toBoolean(display?.wwn) } : {}),
        ...(display?.total ? { total: toBoolean(display?.total) } : {}),
        ...(display?.usage ? { usage: toBoolean(display?.usage) } : {}),
        ...(display?.text ? { text: toBoolean(display?.text) } : {}),
        ...(display?.warning
            ? { warning: Number.parseInt(display?.warning, 10) }
            : {}),
        ...(display?.critical
            ? { critical: Number.parseInt(display?.critical, 10) }
            : {}),
        ...(display?.hot ? { hot: Number.parseInt(display?.hot, 10) } : {}),
        ...(display?.max ? { max: Number.parseInt(display?.max, 10) } : {}),
        locale: display?.locale ?? 'en_US',
    }) as RecursivePartial<DynamixConfig>;
});

export const dynamix = createSlice({
    name: 'dynamix',
    initialState,
    reducers: {
        updateDynamixConfig(
            state,
            action: PayloadAction<RecursivePartial<SliceState>>
        ) {
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
