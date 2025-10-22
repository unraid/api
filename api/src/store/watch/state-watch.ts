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

    private async handleStateFileUpdate(eventPath: string, event: 'add' | 'change') {
        const stateFile = this.getStateFileKeyFromPath(eventPath);
        if (!stateFile) {
            emhttpLogger.trace('Failed to resolve a stateFileKey from path: %s', eventPath);
            return;
        }

        try {
            emhttpLogger.debug('Loading state file for %s after %s event', stateFile, event);
            await store.dispatch(loadSingleStateFile(stateFile));
        } catch (error: unknown) {
            emhttpLogger.error(
                'Failed to load state file: [%s] after %s event\nerror: %o',
                stateFile,
                event,
                error as object
            );
        }
    }

    private readonly setupChokidarWatchForState = () => {
        const { states } = getters.paths();
        for (const key of Object.values(StateFileKey)) {
            if (!excludedWatches.includes(key)) {
                const pathToWatch = join(states, `${key}.ini`);
                emhttpLogger.debug('Setting up watch for path: %s', pathToWatch);
                const stateWatch = watch(pathToWatch, chokidarOptionsForStateKey(key));
                stateWatch.on('add', async (path) => this.handleStateFileUpdate(path, 'add'));
                stateWatch.on('change', async (path) => this.handleStateFileUpdate(path, 'change'));
                this.fileWatchers.push(stateWatch);
            }
        }
    };
}
