import { join, parse } from 'path';

import type { ChokidarOptions, FSWatcher } from 'chokidar';
import { watch } from 'chokidar';

import { emhttpLogger } from '@app/core/log.js';
import { CHOKIDAR_USEPOLLING } from '@app/environment.js';
import { getters, store } from '@app/store/index.js';
import { loadSingleStateFile } from '@app/store/modules/emhttp.js';
import { loadRegistrationKey } from '@app/store/modules/registration.js';
import { StateFileKey } from '@app/store/types.js';

const POLLED_STATE_KEYS = [StateFileKey.disks, StateFileKey.shares] as const;
const POLLED_STATE_KEY_SET = new Set<StateFileKey>(POLLED_STATE_KEYS);
const ATOMIC_REPLACEMENT_WINDOW_MS = 200;

const chokidarOptionsForStateKey = (key: StateFileKey): ChokidarOptions => ({
    atomic: ATOMIC_REPLACEMENT_WINDOW_MS,
    ignoreInitial: true,
    ...(POLLED_STATE_KEY_SET.has(key)
        ? {
              usePolling: true,
              interval: 10_000,
          }
        : {
              usePolling: CHOKIDAR_USEPOLLING,
          }),
});

export class StateManager {
    public static instance: StateManager | null = null;
    public readonly ready: Promise<void>;
    private readonly fileWatchers: FSWatcher[] = [];

    private constructor() {
        this.ready = this.setupChokidarWatchForState();
    }

    public static getInstance(): StateManager {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager();
        }

        return StateManager.instance;
    }

    public async close(): Promise<void> {
        await Promise.all(this.fileWatchers.map(async (watcher) => watcher.close()));
        this.fileWatchers.length = 0;

        if (StateManager.instance === this) {
            StateManager.instance = null;
        }
    }

    private getStateFileKeyFromPath(path: string): StateFileKey | undefined {
        const parsed = parse(path);
        return StateFileKey[parsed.name];
    }

    private async reloadStateFile(stateFile: StateFileKey, reason: 'add' | 'change' | 'startup-sync') {
        emhttpLogger.debug('Loading state file for %s after %s', stateFile, reason);
        await store.dispatch(loadSingleStateFile(stateFile));
        if (stateFile === StateFileKey.var) {
            await store.dispatch(loadRegistrationKey());
        }
    }

    private async handleStateFileUpdate(eventPath: string, event: 'add' | 'change') {
        const stateFile = this.getStateFileKeyFromPath(eventPath);
        if (!stateFile) {
            emhttpLogger.trace('Failed to resolve a stateFileKey from path: %s', eventPath);
            return;
        }

        try {
            await this.reloadStateFile(stateFile, event);
        } catch (error: unknown) {
            emhttpLogger.error(
                'Failed to load state file: [%s] after %s event\nerror: %o',
                stateFile,
                event,
                error as object
            );
        }
    }

    private readonly reconcileStateAfterWatchSetup = async () => {
        for (const stateFile of Object.values(StateFileKey)) {
            await this.reloadStateFile(stateFile, 'startup-sync');
        }
    };

    private readonly setupChokidarWatchForState = async () => {
        const { states } = getters.paths();

        for (const key of Object.values(StateFileKey)) {
            const pathToWatch = join(states, `${key}.ini`);
            emhttpLogger.debug('Setting up watch for path: %s', pathToWatch);
            const stateWatch = watch(pathToWatch, chokidarOptionsForStateKey(key));
            stateWatch.on('add', async (path) => this.handleStateFileUpdate(path, 'add'));
            stateWatch.on('change', async (path) => this.handleStateFileUpdate(path, 'change'));
            this.fileWatchers.push(stateWatch);
        }

        await this.reconcileStateAfterWatchSetup();
    };
}
