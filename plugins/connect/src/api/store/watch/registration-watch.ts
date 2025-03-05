import { watch } from 'chokidar';

import { CHOKIDAR_USEPOLLING } from '@app/environment.js';
import { store } from '@app/store/index.js';
import { loadRegistrationKey } from '@app/store/modules/registration.js';

export const setupRegistrationKeyWatch = () => {
    watch('/boot/config', {
        persistent: true,
        ignoreInitial: true,
        ignored: (path: string) => !path.endsWith('.key'),
        usePolling: CHOKIDAR_USEPOLLING === true,
    }).on('all', async () => {
        // Load updated key into store
        await store.dispatch(loadRegistrationKey());
    });
};
