import { writeFileSync } from 'fs';
import { join } from 'path';

import { isEqual } from 'lodash-es';

import type { RootState } from '@app/store';
import { NODE_ENV } from '@app/environment';
import { store } from '@app/store';
import { syncInfoApps } from '@app/store/sync/info-apps-sync';
import { syncRegistration } from '@app/store/sync/registration-sync';
import { FileLoadStatus } from '@app/store/types';
import { setupConfigPathWatch } from '@app/store/watch/config-watch';

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

            // Update docker app counts
            await syncInfoApps(lastState);
        }

        if (
            NODE_ENV === 'development' &&
            !isEqual(state, lastState) &&
            state.paths['myservers-config-states']
        ) {
            writeFileSync(join(state.paths.states, 'config.log'), JSON.stringify(state.config, null, 2));
            writeFileSync(
                join(state.paths.states, 'dynamicRemoteAccess.log'),
                JSON.stringify(state.dynamicRemoteAccess, null, 2)
            );
            writeFileSync(
                join(state.paths.states, 'graphql.log'),
                JSON.stringify(state.minigraph, null, 2)
            );
            writeFileSync(
                join(state.paths.states, 'notifications.log'),
                JSON.stringify(state.notifications, null, 2)
            );
        }

        lastState = state;
    });

    setupConfigPathWatch();
};
