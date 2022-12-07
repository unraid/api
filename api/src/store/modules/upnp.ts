import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { stopUpnpJobs, initUpnpJobs } from '@app/upnp/jobs';
import type { Mapping } from '@runonflux/nat-upnp';
import { renewUpnpLease, removeUpnpLease, getWanPortForUpnp, getUpnpMappings, parseStringToNumberOrNull } from '@app/upnp/helpers';
import type { RootState } from '@app/store';
import { upnpLogger } from '@app/core';
import { setUpnpEnabledToValue, setWanPortToValue } from '@app/store/modules/config';

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
type UpnpEnableReturnValue = Pick<UpnpState, 'renewalJobRunning' | 'wanPortForUpnp' | 'localPortForUpnp'>;
type ErrorMessagePayload = { message: string; type: 'removal' | 'renewal' | 'mapping' };

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
	dispatch: any;
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

export const enableUpnp = createAsyncThunk<UpnpEnableReturnValue, EnableUpnpThunkArgs, { state: RootState }>('upnp/enable', async (leaseRenewalArgs, { getState, dispatch }) => {
	const { upnp } = getState();

	const wanPortArgAsNumber = leaseRenewalArgs?.wanport ? parseStringToNumberOrNull(leaseRenewalArgs?.wanport) : null;

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
			await renewUpnpLease({ localPortForUpnp: localPortToUse, wanPortForUpnp: wanPortToUse });
			return { renewalJobRunning, wanPortForUpnp: wanPortToUse, localPortForUpnp: localPortToUse };
		} catch (error: unknown) {
			const message = `Error: Failed Opening UPNP Public Port [${wanPortToUse}] Local Port [${localPortToUse}] Message: [${error instanceof Error ? error.message : 'N/A'}]`;
			dispatch(setUpnpEnabledToValue(message));
			throw new Error(message);
		}
	}

	throw new Error('No wan port found, disabling UPNP');
});

export const disableUpnp = createAsyncThunk<{ renewalJobRunning: boolean }, void, { state: RootState }>('upnp/disable', async (_, { getState }) => {
	const { upnp: { localPortForUpnp, wanPortForUpnp } } = getState();

	const renewalJobRunning = stopUpnpJobs();
	if (localPortForUpnp && wanPortForUpnp) {
		try {
			await removeUpnpLease({ localPortForUpnp, wanPortForUpnp });
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

export const { updateMappings } = upnp.actions;
