import { emhttpLogger } from '@app/core/log';

import { watch, type FSWatcher } from 'chokidar';
import { getters, store } from '@app/store';
import { StateFileKey } from '@app/store/types';
import { parse, join } from 'path';
import { loadSingleStateFile } from '@app/store/modules/emhttp';

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

        const pathWatch = watch(join(states, '*.ini'), {
            usePolling: process.env.CHOKIDAR_USEPOLLING === 'true',
        });
        pathWatch.on('all', async (_, path) => {
            const stateFile = this.getStateFileKeyFromPath(path);
            if (stateFile) {
                try {
                    await store.dispatch(loadSingleStateFile(stateFile));
                } catch (error: unknown) {
                    emhttpLogger.error(
                        'Failed to load state file: [%s]\nerror:  %o',
                        stateFile,
                        error
                    );
                }
            }
        });
        this.fileWatchers.push(pathWatch);
    };
}
