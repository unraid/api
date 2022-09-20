import { RootState, store } from '@app/store';
import { SliceState as ConfigSliceState, initialState } from '@app/store/modules/config';
import type { MyServersConfig } from '@app/types/my-servers-config';
import { syncConfigToDisk } from '@app/store/sync/config-disk-sync';
import { syncApiKeyChanges } from '@app/store/sync/api-key-sync';
import { sync2FA } from '@app/store/sync/2fa-sync';
import { setupConfigPathWatch } from './watch/config-path-watch';
import { FileLoadStatus } from './types';

export const getWriteableConfig = (config: ConfigSliceState): MyServersConfig => {
	// Get current state
	const { api, local, notifier, remote, upc } = config;

	// Create new state
	const newState: MyServersConfig = {
		api: api ?? initialState.api,
		local: local ?? initialState.local,
		notifier: notifier ?? initialState.notifier,
		remote: remote ?? initialState.remote,
		upc: upc ?? initialState.upc };
	return newState;
};

export const startStoreSync = async () => {
	// The last state is stored so we don't end up in a loop of writing -> reading -> writing
	let lastState: RootState | null = null;

	// Update cfg when store changes
	store.subscribe(async () => {
		const state = store.getState();

		// Config dependent options, wait until config loads to execute
		if (state.config.status === FileLoadStatus.LOADED) {
			// Write changes to disk
			await syncConfigToDisk(lastState);

			// Update API key
			await syncApiKeyChanges(lastState);

			// Update 2FA
			await sync2FA();
		}

		lastState = state;
	});

	setupConfigPathWatch();
};
