import { FileLoadStatus, loadConfigFile } from '@app/store/modules/config';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import merge from 'lodash.merge';

type SliceState = {
	status: FileLoadStatus;
	ipv4: {
		lan: string | null;
		wan: string | null;
	};
	ipv6: {
		lan: string | null;
		wan: string | null;
	};
};

const initialState: SliceState = {
	status: FileLoadStatus.UNLOADED,
	ipv4: {
		lan: null,
		wan: null,
	},
	ipv6: {
		lan: null,
		wan: null,
	},
};

export const nginx = createSlice({
	name: 'nginx',
	initialState,
	reducers: {
		updateNginxState(state, action: PayloadAction<Partial<typeof initialState>>) {
			return merge(state, action.payload);
		},
	},
	extraReducers(builder) {
		builder.addCase(loadConfigFile.pending, (state, _action) => {
			state.status = FileLoadStatus.LOADING;
		});
		builder.addCase(loadConfigFile.fulfilled, (state, action) => {
			merge(state, action.payload, { status: FileLoadStatus.LOADED });
		});
	},
});

export const { updateNginxState } = nginx.actions;
