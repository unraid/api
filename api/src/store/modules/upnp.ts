import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { stopUpnpJobs, initUpnpJobs } from '@app/upnp/jobs';
import type { Mapping } from '@runonflux/nat-upnp';
import { renewUpnpLease } from '@app/upnp/helpers';
import type { RootState } from '@app/store';

interface UpnpState {
	upnpEnabled: boolean;
	wanPortForUpnp: number | null;
	localPortForUpnp: number | null;
	renewalError: unknown;
	mappings: Mapping[];
	renewalJobRunning: boolean;
}

export const initialState: UpnpState = {
	upnpEnabled: false,
	renewalError: null,
	wanPortForUpnp: null,
	localPortForUpnp: null,
	mappings: [],
	renewalJobRunning: false,
};

export type LeaseRenewalArgs = Pick<UpnpState, 'localPortForUpnp' | 'wanPortForUpnp'>;
type UpnpEnableReturnValue = LeaseRenewalArgs & Pick<UpnpState, 'renewalJobRunning'>;

export const renewLease = createAsyncThunk<void, LeaseRenewalArgs>('upnp/renew', async leaseRenewalArgs => {
	await renewUpnpLease(leaseRenewalArgs);
});

export const enableUpnp = createAsyncThunk<UpnpEnableReturnValue, LeaseRenewalArgs, { state: RootState }>('upnp/enable', async (leaseRenewalArgs, { getState, dispatch }) => {
	const { upnp } = getState();
	// If the wan port changes we should negotiate this by removing the old lease and creating a new one
	const renewalJobRunning = upnp.renewalJobRunning ? true : initUpnpJobs();
	if (upnp.wan)
	dispatch();

	await renewUpnpLease(leaseRenewalArgs);

	return { wanPortForUpnp, localPortForUpnp, renewalJobRunning };
});

export const upnp = createSlice({
	name: 'upnp',
	initialState,
	reducers: {
		disableUpnp(state) {
			state.renewalJobRunning = stopUpnpJobs();
			state.upnpEnabled = false;
		},
		updateMappings(state, action: PayloadAction<Mapping[]>) {
			state.mappings = action.payload;
		},
		setError(state, action: PayloadAction<unknown>) {
			state.renewalError = action.payload;
		},
	},
	extraReducers(builder) {
		builder.addCase(enableUpnp.pending, state => {
			state.upnpEnabled = true;
		});
		builder.addCase(enableUpnp.fulfilled, (state, action) => {
			state.wanPortForUpnp = action.payload.wanPort;
			state.localPortForUpnp = action.payload.localPort;
			state.renewalJobRunning = action.payload.running;
		});
	},
});

export const { disableUpnp, setError, updateMappings } = upnp.actions;
