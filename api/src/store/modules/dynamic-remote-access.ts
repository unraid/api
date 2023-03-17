import { type AccessUrl } from '@app/graphql/generated/client/graphql';
import { DynamicRemoteAccessType } from '@app/remoteAccess/types';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface DynamicRemoteAccessState {
	runningType: DynamicRemoteAccessType; // Is Dynamic Remote Access actively running - shows type of access currently running
	allowedUrls: AccessUrl[]; // Not used yet, will be used to facilitate allowlisting clients
	accessUrl: AccessUrl | null;
}

const initialState: DynamicRemoteAccessState = {
	runningType: DynamicRemoteAccessType.DISABLED,
	allowedUrls: [],
	accessUrl: null,
};

const dynamicRemoteAccess = createSlice({
	name: 'dynamicRemoteAccess',
	initialState,
	reducers: {
		setRemoteAccessRunningType(state, action: PayloadAction<DynamicRemoteAccessType>) {
			state.runningType = action.payload;
		},
		setAllowedRemoteAccessUrls(state, action: PayloadAction<AccessUrl | null>) {
			if (action.payload) {
				if (state.runningType === DynamicRemoteAccessType.DISABLED) {
					state.allowedUrls = [action.payload];
				} else {
					state.allowedUrls = [...state.allowedUrls, action.payload];
				}
			} else {
				state.allowedUrls = [];
			}
		},
	},
});

const { actions, reducer } = dynamicRemoteAccess;

export const { setAllowedRemoteAccessUrls, setRemoteAccessRunningType } = actions;
export const dynamicRemoteAccessReducer = reducer;
