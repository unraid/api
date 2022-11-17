import { RootState, store } from '@app/store';
import { syncConfigToDisk } from '@app/store/sync/config-disk-sync';
import { syncApiKeyChanges } from '@app/store/sync/api-key-sync';
import { sync2FA } from '@app/store/sync/2fa-sync';
import { setupConfigPathWatch } from './watch/config-watch';
import { FileLoadStatus } from './types';
import { syncRegistration } from '@app/store/sync/registration-sync';
import { syncArray } from '@app/store/sync/array-sync';
import { syncInfoApps } from '@app/store/sync/info-apps-sync';

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

			// Update registration
			await syncRegistration(lastState);

			// Update array
			await syncArray(lastState);

			// Update docker app counts
			await syncInfoApps(lastState);
		}

		lastState = state;
	});

	setupConfigPathWatch();
};
