import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { stopUpnpJobs, initUpnpJobs } from '@app/upnp/jobs';
import type { Mapping } from '@runonflux/nat-upnp';
import { renewUpnpLease, removeUpnpLease } from '@app/upnp/helpers';
import type { RootState } from '@app/store';
import { upnpLogger } from '@app/core';
import { setUpnpToOff } from './config';

interface UpnpState {
	upnpEnabled: boolean;
	wanPortForUpnp: number | null;
	localPortForUpnp: number | null;
	errors: {
		renewal: string | null;
		removal: string | null;
		mapping: string | null;
	};
	mappings: Mapping[];
	renewalJobRunning: boolean;
}

export const initialState: UpnpState = {
	upnpEnabled: false,
	errors: {
		removal: null,
		renewal: null,
		mapping: null,
	},
	wanPortForUpnp: null,
	localPortForUpnp: null,
	mappings: [],
	renewalJobRunning: false,
};

export type LeaseRenewalArgs = Pick<UpnpState, 'localPortForUpnp' | 'wanPortForUpnp' | 'errors'>;
type UpnpEnableReturnValue = LeaseRenewalArgs & Pick<UpnpState, 'renewalJobRunning'>;
type ErrorMessagePayload = { message: string; type: 'removal' | 'renewal' | 'mapping' };

export const upnpStoreHasError = (errors: UpnpState['errors']): boolean => errors.mapping !== null || errors.removal !== null || errors.renewal !== null;

export const renewLease = createAsyncThunk<void, LeaseRenewalArgs | void, { state: RootState }>('upnp/renew', async (leaseRenewalArgs, { getState }) => {
	const { wanPortForUpnp, localPortForUpnp, errors } = leaseRenewalArgs ?? getState().upnp;
	await renewUpnpLease({ wanPortForUpnp, localPortForUpnp, errors });
});

export const enableUpnp = createAsyncThunk<UpnpEnableReturnValue, LeaseRenewalArgs, { state: RootState }>('upnp/enable', async (leaseRenewalArgs, { getState, dispatch }) => {
	const { upnp } = getState();
	// If the wan port changes we should negotiate this by removing the old lease and creating a new one
	const renewalJobRunning = upnp.renewalJobRunning ? true : initUpnpJobs();
	upnpLogger.info('current upnp state', upnp);
	if (upnp.wanPortForUpnp || upnp.localPortForUpnp) {
		await removeUpnpLease(leaseRenewalArgs);
	}

	await renewUpnpLease(leaseRenewalArgs);

	return { renewalJobRunning, ...leaseRenewalArgs };
});

export const disableUpnp = createAsyncThunk< { renewalJobRunning: boolean }, void, { state: RootState }>('upnp/disable', async ({ dispatch }) => {
	const renewalJobRunning = stopUpnpJobs();
	return { renewalJobRunning };
});

export const setError = createAsyncThunk<ErrorMessagePayload, ErrorMessagePayload>('upnp/setError', async (errorPayload, { dispatch }) => {
	dispatch(setUpnpToOff());
	await dispatch(disableUpnp());
	return errorPayload;
});

export const upnp = createSlice({
	name: 'upnp',
	initialState,
	reducers: {
		updateMappings(state, action: PayloadAction<Mapping[]>) {
			state.mappings = action.payload;
		},
	},
	extraReducers(builder) {
		builder.addCase(enableUpnp.pending, state => {
			state.upnpEnabled = true;
		});
		builder.addCase(enableUpnp.fulfilled, (state, action) => {
			state.localPortForUpnp = action.payload.localPortForUpnp;
			state.wanPortForUpnp = action.payload.wanPortForUpnp;
			state.renewalJobRunning = action.payload.renewalJobRunning;
		});

		builder.addCase(setError.fulfilled, (state, action) => {
			state.errors[action.payload.type] = action.payload.message;
		});
		builder.addCase(disableUpnp.fulfilled, (state, action) => {
			state.renewalJobRunning = action.payload.renewalJobRunning;
			state.upnpEnabled = false;
		});
	},
});

export const { updateMappings } = upnp.actions;
