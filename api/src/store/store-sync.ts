import { writeFileSync } from 'fs';
import { join } from 'path';
import { Injectable } from '@nestjs/common';
import { PathsConfig } from '../config/paths.config';

import { isEqual } from 'lodash-es';

import type { RootState } from '@app/store/index.js';
import { NODE_ENV } from '@app/environment.js';
import { store } from '@app/store/index.js';
import { syncInfoApps } from '@app/store/sync/info-apps-sync.js';
import { syncRegistration } from '@app/store/sync/registration-sync.js';
import { FileLoadStatus } from '@app/store/types.js';

@Injectable()
export class StoreSyncService {
    constructor(private readonly paths: PathsConfig) {}

    syncState(state: any) {
        writeFileSync(join(this.paths.states, 'config.log'), JSON.stringify(state.config, null, 2));
        writeFileSync(
            join(this.paths.states, 'dynamicRemoteAccess.log'),
            JSON.stringify(state.dynamicRemoteAccess, null, 2)
        );
        writeFileSync(
            join(this.paths.states, 'graphql.log'),
            JSON.stringify(state.graphql, null, 2)
        );
    }
}

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
        }

        lastState = state;
    });
};
