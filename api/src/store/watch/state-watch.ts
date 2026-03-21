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
const STATE_FILE_NAMES = new Set(Object.values(StateFileKey).map((key) => `${key}.ini`));

const shouldIgnoreStatePath = (path: string): boolean => {
    const parsed = parse(path);
    const isStateFile = parsed.ext === '.ini' && STATE_FILE_NAMES.has(parsed.base);

    if (!isStateFile) {
        return true;
    }

    const stateFileKey = StateFileKey[parsed.name];
    return POLLED_STATE_KEY_SET.has(stateFileKey);
};

const chokidarOptionsForStateDirectory = (): ChokidarOptions => ({
    ignoreInitial: true,
    ignored: (path, stats) => {
        if (stats?.isDirectory()) {
            return false;
        }
        return shouldIgnoreStatePath(path);
    },
    usePolling: CHOKIDAR_USEPOLLING,
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

        emhttpLogger.debug('Setting up watch for path: %s', states);
        const directoryWatch = watch(states, chokidarOptionsForStateDirectory());
        directoryWatch.on('add', async (path) => this.handleStateFileUpdate(path, 'add'));
        directoryWatch.on('change', async (path) => this.handleStateFileUpdate(path, 'change'));
        this.fileWatchers.push(directoryWatch);

        for (const key of POLLED_STATE_KEYS) {
            const pathToWatch = join(states, `${key}.ini`);
            emhttpLogger.debug('Setting up watch for path: %s', pathToWatch);
            const stateWatch = watch(pathToWatch, {
                ignoreInitial: true,
                usePolling: true,
                interval: 10_000,
            });
            stateWatch.on('add', async (path) => this.handleStateFileUpdate(path, 'add'));
            stateWatch.on('change', async (path) => this.handleStateFileUpdate(path, 'change'));
            this.fileWatchers.push(stateWatch);
        }

        await this.reconcileStateAfterWatchSetup();
    };
}
