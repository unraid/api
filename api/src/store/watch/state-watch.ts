import { join, parse } from 'path';

import type { FSWatcher, FSWInstanceOptions } from 'chokidar';
import { watch } from 'chokidar';

import { emhttpLogger } from '@app/core/log.js';
import { CHOKIDAR_USEPOLLING } from '@app/environment.js';
import { getters, store } from '@app/store/index.js';
import { loadSingleStateFile } from '@app/store/modules/emhttp.js';
import { StateFileKey } from '@app/store/types.js';

// Configure any excluded nchan channels that we support here
const excludedWatches: StateFileKey[] = [StateFileKey.devs];

const chokidarOptionsForStateKey = (
    key: StateFileKey
): Partial<Pick<FSWInstanceOptions, 'usePolling' | 'interval'>> => {
    if ([StateFileKey.disks, StateFileKey.shares].includes(key)) {
        return {
            usePolling: true,
            interval: 10_000,
        };
    }
    return { usePolling: CHOKIDAR_USEPOLLING };
};

export class StateManager {
    public static instance: StateManager | null = null;
    private readonly fileWatchers: FSWatcher[] = [];

    private constructor() {
        this.setupChokidarWatchForState();
    }

    public static getInstance(): StateManager {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager();
        }

        return StateManager.instance;
    }

    private getStateFileKeyFromPath(path: string): StateFileKey | undefined {
        const parsed = parse(path);
        return StateFileKey[parsed.name];
    }

    private readonly setupChokidarWatchForState = () => {
        const { states } = getters.paths();
        for (const key of Object.values(StateFileKey)) {
            if (!excludedWatches.includes(key)) {
                const pathToWatch = join(states, `${key}.ini`);
                emhttpLogger.debug('Setting up watch for path: %s', pathToWatch);
                const stateWatch = watch(pathToWatch, chokidarOptionsForStateKey(key));
                stateWatch.on('change', async (path) => {
                    const stateFile = this.getStateFileKeyFromPath(path);
                    if (stateFile) {
                        try {
                            emhttpLogger.debug('Loading state file for %s', stateFile);
                            await store.dispatch(loadSingleStateFile(stateFile));
                        } catch (error: unknown) {
                            emhttpLogger.error(
                                'Failed to load state file: [%s]\nerror:  %o',
                                stateFile,
                                error
                            );
                        }
                    } else {
                        emhttpLogger.trace('Failed to resolve a stateFileKey from path: %s', path);
                    }
                });
                this.fileWatchers.push(stateWatch);
            }
        }
    };
}
