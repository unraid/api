import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';
import { logoutUser } from '@app/store/modules/config';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ApiKeyInitialState {
	status: API_KEY_STATUS;
}

const initialState: ApiKeyInitialState = {
	status: API_KEY_STATUS.NO_API_KEY,
};

const apiKey = createSlice({
	name: 'apiKey',
	initialState,
	reducers: {
		setApiKeyState(state, action: PayloadAction<API_KEY_STATUS>) {
			state.status = action.payload;
		},
	},
	extraReducers(builder) {
		builder.addCase(logoutUser.pending, state => {
			state.status = API_KEY_STATUS.NO_API_KEY;
		});
	},
});

const { actions, reducer } = apiKey;

export const { setApiKeyState } = actions;
export const apiKeyReducer = reducer;
