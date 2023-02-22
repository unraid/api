import type { RootState } from '@app/store';
import { store } from '@app/store';
import { FileLoadStatus } from './types';
import { syncRegistration } from '@app/store/sync/registration-sync';
import { syncArray } from '@app/store/sync/array-sync';
import { syncInfoApps } from '@app/store/sync/info-apps-sync';
import { setupConfigPathWatch } from '@app/store/watch/config-watch';
import { NODE_ENV } from '@app/environment';
import { writeFileSync } from 'fs';
import { isEqual } from 'lodash';
import { join } from 'path';

export const startStoreSync = async () => {
	// The last state is stored so we don't end up in a loop of writing -> reading -> writing
	let lastState: RootState | null = null;

	// Update cfg when store changes
	store.subscribe(async () => {
		const state = store.getState();
		// Config dependent options, wait until config loads to execute
		if (state.config.status === FileLoadStatus.LOADED) {
			// Update 2FA
			// await sync2FA();

			// Update registration
			await syncRegistration(lastState);

			// Update array
			await syncArray(lastState);

			// Update docker app counts
			await syncInfoApps(lastState);
		}

		if (NODE_ENV === 'development' && !isEqual(state, lastState) && state.paths['myservers-config-states']) {
			writeFileSync(join(state.paths.states, 'config.log'), JSON.stringify(state.config, null, 2));
			writeFileSync(join(state.paths.states, 'servers.log'), JSON.stringify(state.servers, null, 2));
		}

		lastState = state;
	});

	setupConfigPathWatch();
};

