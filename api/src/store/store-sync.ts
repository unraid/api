import { join } from 'path';

import { ensureWriteSync } from '@unraid/shared/util/file.js';
import { isEqual } from 'lodash-es';

import type { RootState } from '@app/store/index.js';
import { NODE_ENV } from '@app/environment.js';
import { store } from '@app/store/index.js';
import { syncRegistration } from '@app/store/sync/registration-sync.js';
import { FileLoadStatus } from '@app/store/types.js';

export const startStoreSync = async () => {
    // The last state is stored so we don't end up in a loop of writing -> reading -> writing
    let lastState: RootState | null = null;

    // Update cfg when store changes
    store.subscribe(async () => {
        const state = store.getState();
        // Config dependent options, wait until config loads to execute
        if (state.config.status === FileLoadStatus.LOADED) {
            // Update registration
            await syncRegistration(lastState);
        }

        if (
            NODE_ENV === 'development' &&
            !isEqual(state, lastState) &&
            state.paths['myservers-config-states']
        ) {
            ensureWriteSync(
                join(state.paths.states, 'config.log'),
                JSON.stringify(state.config, null, 2)
            );
            ensureWriteSync(
                join(state.paths.states, 'graphql.log'),
                JSON.stringify(state.minigraph, null, 2)
            );
        }

        lastState = state;
    });
};
