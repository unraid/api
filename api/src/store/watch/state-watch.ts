import { watch } from 'chokidar';
import { join } from 'path';
import { PathsConfig } from '../../config/paths.config.js';
import { store } from '@app/store/index.js';
import { updateState } from '@app/store/modules/state.js';
import { parseStateFile } from '@app/core/utils/misc/parse-state-file.js';
import { StateFileKey } from '@app/core/types/state.js';

const excludedWatches: StateFileKey[] = [
    StateFileKey.DISPLAY,
    StateFileKey.DISKS,
    StateFileKey.DOCKER,
    StateFileKey.EMHTTP,
    StateFileKey.IDENT,
    StateFileKey.SHARES,
    StateFileKey.SLOTS,
    StateFileKey.USERS,
];

export const setupStateWatch = () => {
    const paths = PathsConfig.getInstance();
    const statePath = paths.states;

    // Watch all state files except excluded ones
    watch(statePath, {
        persistent: true,
        ignoreInitial: true,
    }).on('change', async (path) => {
        const key = path.split('/').pop()?.replace('.ini', '') as StateFileKey;
        if (key && !excludedWatches.includes(key)) {
            const state = await parseStateFile(path);
            store.dispatch(updateState({ [key]: state }));
        }
    });
};
