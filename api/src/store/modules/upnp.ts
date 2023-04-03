import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { stopUpnpJobs, initUpnpJobs } from '@app/upnp/jobs';
import type { Mapping } from '@runonflux/nat-upnp';
import { renewUpnpLease, removeUpnpLease, getWanPortForUpnp, getUpnpMappings } from '@app/upnp/helpers';
import { type AppDispatch, type RootState } from '@app/store';
import { upnpLogger } from '@app/core';
import { setUpnpState, setWanPortToValue } from '@app/store/modules/config';
import { toNumberOrNull } from '@app/core/utils/casting';

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

export type LeaseRenewalArgs = { localPortForUpnp: number; wanPortForUpnp: number };
export type UpnpEnableReturnValue = Pick<UpnpState, 'renewalJobRunning' | 'wanPortForUpnp' | 'localPortForUpnp'>;
type EnableUpnpThunkArgs = { portssl: number; wanport?: string } | void;

/**
 * Return if the removal or renewal set failed, this indicates that an error was probably fatal
 * @param errors
 * @returns
 */
export const upnpStoreHasFatalError = (errors: UpnpState['errors'] | null): boolean => errors ? errors.removal !== null || errors.renewal !== null : false;

/*
* Choose port to use - if we pass arguments it means we're re-initing this function, so ignore upnp.wanPortForUpnp
* If we don't pass args, use the saved WAN port since that means the job is running
*/
const getWanPortToUse = async ({
	leaseRenewalArgs,
	wanPortArgAsNumber,
	wanPortForUpnp,
	dispatch,
}:
{
	leaseRenewalArgs: EnableUpnpThunkArgs;
	wanPortArgAsNumber: number | null;
	wanPortForUpnp: null | number;
	dispatch: AppDispatch;
}): Promise<number | null> => {
	if (leaseRenewalArgs) {
		if (wanPortArgAsNumber) {
			return wanPortArgAsNumber;
		}

		const currentMappings = await getUpnpMappings();

		const newPort = getWanPortForUpnp(currentMappings);
		if (newPort) {
			dispatch(setWanPortToValue(newPort));
		}

		return newPort;
	}

	return wanPortForUpnp;
};

export const enableUpnp = createAsyncThunk<UpnpEnableReturnValue, EnableUpnpThunkArgs, { state: RootState, dispatch: AppDispatch }>('upnp/enable', async (leaseRenewalArgs, { getState, dispatch }) => {
	const { upnp, emhttp } = getState();

	const wanPortArgAsNumber = leaseRenewalArgs?.wanport ? toNumberOrNull(leaseRenewalArgs?.wanport) : null;

	// If the wan port changes we try to negotiate this by removing the old lease first
	if (leaseRenewalArgs
		&& upnp.wanPortForUpnp
		&& upnp.localPortForUpnp
		&& (wanPortArgAsNumber !== upnp.wanPortForUpnp || leaseRenewalArgs.portssl !== upnp.localPortForUpnp)) {
		try {
			await removeUpnpLease({ wanPortForUpnp: upnp.wanPortForUpnp, localPortForUpnp: upnp.localPortForUpnp });
		} catch (error: unknown) {
			upnpLogger.warn(`Caught error [${error instanceof Error ? error.message : 'N/A'}] when removing lease, could be non-fatal, so continuing`);
		}
	}

	// Start the renewal Job if it's not already running. When run from inside a job this will return true
	const renewalJobRunning = upnp.renewalJobRunning ? true : initUpnpJobs();

	const wanPortToUse = await getWanPortToUse({ leaseRenewalArgs, wanPortForUpnp: upnp.wanPortForUpnp, dispatch, wanPortArgAsNumber });
	const localPortToUse = leaseRenewalArgs ? leaseRenewalArgs.portssl : upnp.localPortForUpnp;
	if (wanPortToUse && localPortToUse) {
		try {
			await renewUpnpLease({ localPortForUpnp: localPortToUse, wanPortForUpnp: wanPortToUse, serverName: emhttp?.var?.name });
			const today = new Date();
			const todayFormatted = `${today.toLocaleDateString()} ${today.toLocaleTimeString()}`;
			dispatch(setUpnpState({ status: `Success: UPNP Lease Renewed [${todayFormatted}] Public Port [${wanPortToUse}] Local Port [${localPortToUse}]` }));

			return { renewalJobRunning, wanPortForUpnp: wanPortToUse, localPortForUpnp: localPortToUse };
		} catch (error: unknown) {
			const message = `Error: Failed Opening UPNP Public Port [${wanPortToUse}] Local Port [${localPortToUse}] Message: [${error instanceof Error ? error.message : 'N/A'}]`;
			dispatch(setUpnpState({ enabled: 'no', status: message }));
			throw new Error(message);
		}
	}

	throw new Error('No WAN port found, disabling UPNP');
});

export const disableUpnp = createAsyncThunk<{ renewalJobRunning: boolean }, void, { state: RootState }>('upnp/disable', async (_, { dispatch, getState }) => {
	const { upnp: { localPortForUpnp, wanPortForUpnp } } = getState();

	const renewalJobRunning = stopUpnpJobs();
	if (localPortForUpnp && wanPortForUpnp) {
		try {
			await removeUpnpLease({ localPortForUpnp, wanPortForUpnp });
			dispatch(setUpnpState({ enabled: 'no', status: 'UPNP Disabled' }));
		} catch (error: unknown) {
			upnpLogger.warn(`Failed to remove UPNP Binding with Error [${error instanceof Error ? error.message : 'N/A'}]`);
		}
	}

	return { renewalJobRunning };
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
		builder.addCase(enableUpnp.rejected, (state, action) => {
			state.errors.renewal = action.error.message ?? 'Undefined Error When Renewing UPNP Lease';
		});

		builder.addCase(disableUpnp.fulfilled, (state, action) => {
			state.renewalJobRunning = action.payload.renewalJobRunning;
			state.wanPortForUpnp = null;
			state.localPortForUpnp = null;
			state.upnpEnabled = false;
		});
	},
});

const { actions, reducer } = upnp;

export const { updateMappings } = actions;
export const upnpReducer = reducer;
