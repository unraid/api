import { watch } from 'chokidar';

import { loadDynamixConfigFile } from '@app/store/actions/load-dynamix-config-file.js';
import { store } from '@app/store/index.js';
import { PathsConfig } from '../../config/paths.config.js';

export const setupDynamixConfigWatch = () => {
    const paths = PathsConfig.getInstance();
    const configPath = paths.dynamixConfig;

    // Update store when cfg changes
    watch(configPath, {
        persistent: true,
        ignoreInitial: true,
    }).on('change', async () => {
        // Load updated dynamix config file into store
        await store.dispatch(loadDynamixConfigFile());
    });
};
