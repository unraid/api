import { getKeyFile } from '@app/core/utils/misc/get-key-file';
import { getters } from '@app/store';
import { FileLoadStatus } from '@app/store/types';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import merge from 'lodash/merge';

export type SliceState = {
	status: FileLoadStatus;
	keyFile: string | null;
};

const initialState = {
	status: FileLoadStatus.UNLOADED,
	keyFile: null,
};

export const loadRegistrationKey = createAsyncThunk<{ keyFile: string }>('config/load-config-file', async () => {
	const keyFile = await getKeyFile(getters.emhttp().var.regFile);

	return {
		keyFile,
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
		builder.addCase(loadRegistrationKey.pending, (state, _action) => {
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
