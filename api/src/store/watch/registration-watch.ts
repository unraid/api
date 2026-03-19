import { watch } from 'chokidar';

import { keyServerLogger } from '@app/core/log.js';
import { store } from '@app/store/index.js';
import { loadSingleStateFile } from '@app/store/modules/emhttp.js';
import { loadRegistrationKey } from '@app/store/modules/registration.js';
import { StateFileKey } from '@app/store/types.js';

export const reloadVarIniWithRetry = async (): Promise<void> => {
    await store.dispatch(loadSingleStateFile(StateFileKey.var));
    await store.dispatch(loadRegistrationKey());
};

export const setupRegistrationKeyWatch = () => {
    let watchQueue: Promise<void> = Promise.resolve();

    // IMPORTANT: /boot/config is on FAT32 flash drive which does NOT support inotify
    // Must use polling to detect file changes on FAT32 filesystems
    watch('/boot/config', {
        persistent: true,
        ignoreInitial: true,
        ignored: (path: string) => !path.endsWith('.key'),
        usePolling: true, // Required for FAT32 - inotify doesn't work
        interval: 5000, // Poll every 5 seconds (balance between responsiveness and CPU usage)
    }).on('all', (event, path) => {
        watchQueue = watchQueue
            .catch(() => undefined)
            .then(async () => {
                keyServerLogger.info('Key file %s: %s', event, path);

                await reloadVarIniWithRetry();
            });

        return watchQueue;
    });
};
