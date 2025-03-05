import { watch } from 'chokidar';

import { loadDynamixConfigFile } from '@app/store/actions/load-dynamix-config-file.js';
import { getters, store } from '@app/store/index.js';

export const setupDynamixConfigWatch = () => {
    const configPath = getters.paths()?.['dynamix-config'];

    // Update store when cfg changes
    watch(configPath, {
        persistent: true,
        ignoreInitial: true,
    }).on('change', async () => {
        // Load updated dynamix config file into store
        await store.dispatch(loadDynamixConfigFile());
    });
};
